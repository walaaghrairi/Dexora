package com.dexora.service;

import com.dexora.entity.EmailVerificationToken;
import com.dexora.entity.User;
import com.dexora.repository.EmailVerificationTokenRepository;
import com.dexora.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationService {
    private final EmailVerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${application.frontend-base-url}")
    private String frontendBaseUrl;

    @Value("${application.security.email-verification.expiration-minutes:30}")
    private long expirationMinutes;

    @Value("${application.security.email-verification.expose-development-link:false}")
    private boolean exposeDevelopmentLink;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Transactional
    public DeliveryResult sendVerification(User user) {
        tokenRepository.deleteAllByUserId(user.getId());

        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        EmailVerificationToken token = new EmailVerificationToken();
        token.setUser(user);
        token.setTokenHash(hash(rawToken));
        token.setExpiresAt(LocalDateTime.now().plusMinutes(expirationMinutes));
        tokenRepository.save(token);

        String verificationUrl = frontendBaseUrl.replaceAll("/$", "")
                + "/verify-email?token="
                + URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
        boolean sent = sendMessage(user, verificationUrl);

        if (!sent) {
            log.info("TuniSign development email verification link for {}: {}", user.getEmail(), verificationUrl);
        }
        return new DeliveryResult(sent, exposeDevelopmentLink ? verificationUrl : null);
    }

    @Transactional
    public User verify(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException("Le lien de vérification est incomplet.");
        }
        EmailVerificationToken token = tokenRepository.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> new IllegalArgumentException("Le lien de vérification est invalide."));
        User user = token.getUser();

        if (token.getConsumedAt() != null) {
            if (user.isEmailVerified()) return user;
            throw new IllegalArgumentException("Ce lien de vérification a déjà été utilisé.");
        }
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Ce lien de vérification a expiré. Demandez un nouveau lien.");
        }

        user.setEmailVerified(true);
        token.setConsumedAt(LocalDateTime.now());
        userRepository.save(user);
        tokenRepository.save(token);
        return user;
    }

    private boolean sendMessage(User user, String verificationUrl) {
        if (mailUsername == null || mailUsername.isBlank()) return false;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailUsername);
            message.setTo(user.getEmail());
            message.setSubject("Vérifiez votre adresse e-mail TuniSign");
            message.setText("Bonjour " + user.getFirstName() + ",\n\n"
                    + "Confirmez votre adresse e-mail en ouvrant ce lien :\n"
                    + verificationUrl + "\n\n"
                    + "Ce lien expire dans " + expirationMinutes + " minutes.\n"
                    + "Si vous n'avez pas créé ce compte, ignorez ce message.");
            mailSender.send(message);
            return true;
        } catch (MailException exception) {
            log.warn("Unable to send verification email to {}: {}", user.getEmail(), exception.getMessage());
            return false;
        }
    }

    private String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 unavailable", exception);
        }
    }

    public record DeliveryResult(boolean emailSent, String developmentVerificationUrl) {}
}
