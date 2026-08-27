package com.dexora.service.impl;

import com.dexora.dto.AuthenticationResponse;
import com.dexora.dto.EmailVerificationResponse;
import com.dexora.dto.GoogleAuthRequest;
import com.dexora.dto.LoginRequest;
import com.dexora.dto.RegisterRequest;
import com.dexora.dto.TwoFactorLoginRequest;
import com.dexora.entity.User;
import com.dexora.enums.AuthProvider;
import com.dexora.enums.Role;
import com.dexora.repository.UserRepository;
import com.dexora.security.GoogleIdentityService;
import com.dexora.security.JwtService;
import com.dexora.security.TotpService;
import com.dexora.service.AuthenticationService;
import com.dexora.service.EmailVerificationService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthenticationServiceImpl implements AuthenticationService {
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final TotpService totpService;
    private final EmailVerificationService emailVerificationService;
    private final GoogleIdentityService googleIdentityService;

    @Override
    public AuthenticationResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Un compte utilise déjà cette adresse e-mail.");
        }

        User user = new User();
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setEmail(email);
        user.setHashPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.STUDENT);
        user.setEmailVerified(false);
        user.setAuthProvider(AuthProvider.LOCAL);
        user = userRepository.save(user);

        EmailVerificationService.DeliveryResult delivery = emailVerificationService.sendVerification(user);
        return AuthenticationResponse.builder()
                .emailVerificationRequired(true)
                .verificationEmailSent(delivery.emailSent())
                .email(email)
                .message(delivery.emailSent()
                        ? "Un lien de vérification a été envoyé par e-mail."
                        : "Compte créé. Utilisez le lien de développement pour vérifier l'adresse.")
                .developmentVerificationUrl(delivery.developmentVerificationUrl())
                .build();
    }

    @Override
    public AuthenticationResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword()));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Identifiants incorrects."));
        if (!user.isEmailVerified()) {
            return AuthenticationResponse.builder()
                    .emailVerificationRequired(true)
                    .email(user.getEmail())
                    .message("Vérifiez votre adresse e-mail avant de vous connecter.")
                    .build();
        }
        return authenticatedResponse(user);
    }

    @Override
    public AuthenticationResponse google(GoogleAuthRequest request) {
        GoogleIdToken.Payload payload = googleIdentityService.verify(request.getCredential());
        String subject = payload.getSubject();
        String email = normalizeEmail(payload.getEmail());
        if (subject == null || subject.isBlank() || email.isBlank()) {
            throw new BadCredentialsException("Le compte Google ne contient pas les informations requises.");
        }

        User user = userRepository.findByGoogleSubject(subject).orElse(null);
        if (user == null) {
            user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                user = createGoogleUser(payload, subject, email);
            } else {
                user.setGoogleSubject(subject);
                user.setAuthProvider(user.getAuthProvider() == AuthProvider.GOOGLE
                        ? AuthProvider.GOOGLE
                        : AuthProvider.BOTH);
                user.setEmailVerified(true);
                user = userRepository.save(user);
            }
        }

        if (!user.isEmailVerified()) {
            user.setEmailVerified(true);
            user = userRepository.save(user);
        }
        return authenticatedResponse(user);
    }

    @Override
    public AuthenticationResponse verifyTwoFactor(TwoFactorLoginRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.getEmail()))
                .orElseThrow(() -> new BadCredentialsException("Identifiants incorrects."));
        if (!user.isEmailVerified()) {
            throw new BadCredentialsException("L'adresse e-mail n'est pas vérifiée.");
        }
        if (!user.isTwoFactorEnabled() || !totpService.isValid(user.getTwoFactorSecret(), request.getCode())) {
            throw new BadCredentialsException("Code d'authentification à deux facteurs invalide.");
        }
        return AuthenticationResponse.builder().token(issueJwt(user)).build();
    }

    @Override
    public EmailVerificationResponse verifyEmail(String token) {
        emailVerificationService.verify(token);
        return EmailVerificationResponse.builder()
                .verified(true)
                .message("Adresse e-mail vérifiée. Vous pouvez maintenant vous connecter.")
                .build();
    }

    @Override
    public EmailVerificationResponse resendVerification(String emailValue) {
        String email = normalizeEmail(emailValue);
        User user = userRepository.findByEmail(email).orElse(null);
        EmailVerificationService.DeliveryResult delivery = null;
        if (user != null && !user.isEmailVerified()) {
            delivery = emailVerificationService.sendVerification(user);
        }
        return EmailVerificationResponse.builder()
                .verified(user != null && user.isEmailVerified())
                .emailSent(delivery != null && delivery.emailSent())
                .message("Si cette adresse correspond à un compte non vérifié, un nouveau lien a été préparé.")
                .developmentVerificationUrl(delivery == null ? null : delivery.developmentVerificationUrl())
                .build();
    }

    private User createGoogleUser(GoogleIdToken.Payload payload, String subject, String email) {
        User user = new User();
        user.setFirstName(claim(payload, "given_name", "Utilisateur"));
        user.setLastName(claim(payload, "family_name", "Google"));
        user.setEmail(email);
        user.setHashPassword(passwordEncoder.encode(randomPassword()));
        user.setRole(Role.STUDENT);
        user.setEmailVerified(true);
        user.setAuthProvider(AuthProvider.GOOGLE);
        user.setGoogleSubject(subject);
        return userRepository.save(user);
    }

    private AuthenticationResponse authenticatedResponse(User user) {
        if (user.isTwoFactorEnabled()) {
            return AuthenticationResponse.builder()
                    .twoFactorRequired(true)
                    .email(user.getEmail())
                    .build();
        }
        return AuthenticationResponse.builder().token(issueJwt(user)).build();
    }

    private String issueJwt(User user) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        return jwtService.generateToken(userDetails);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String claim(GoogleIdToken.Payload payload, String name, String fallback) {
        Object value = payload.get(name);
        return value instanceof String text && !text.isBlank() ? text.trim() : fallback;
    }

    private String randomPassword() {
        byte[] value = new byte[32];
        new SecureRandom().nextBytes(value);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }
}
