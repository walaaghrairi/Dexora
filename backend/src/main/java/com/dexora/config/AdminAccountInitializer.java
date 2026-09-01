package com.dexora.config;

import com.dexora.entity.User;
import com.dexora.enums.Role;
import com.dexora.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminAccountInitializer implements ApplicationRunner {
    private final UserRepository userRepository;

    @Value("${application.security.admin-email:}")
    private String adminEmail;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String email = adminEmail == null ? "" : adminEmail.trim().toLowerCase(Locale.ROOT);
        if (email.isBlank()) {
            return;
        }
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            log.warn("ADMIN_EMAIL est configuré, mais aucun compte ne correspond à {}", email);
            return;
        }
        if (user.getRole() != Role.ADMIN || !user.isActive()) {
            user.setRole(Role.ADMIN);
            user.setActive(true);
            userRepository.save(user);
            log.info("Compte administrateur activé pour {}", email);
        }
    }
}
