package com.forgeops.backend.config;

import com.forgeops.backend.auth.entity.User;
import com.forgeops.backend.auth.entity.UserRole;
import com.forgeops.backend.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

/**
 * Optional one-time bootstrap for the first administrator account.
 * Disabled by default and configured only through environment variables.
 */
@Configuration
@ConditionalOnProperty(name = "forgeops.bootstrap.enabled", havingValue = "true")
public class DatabaseInitializer {

    private static final Logger log = LoggerFactory.getLogger(DatabaseInitializer.class);

    @Bean
    @Transactional
    public CommandLineRunner initDefaultUser(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${forgeops.bootstrap.admin-email}") String email,
            @Value("${forgeops.bootstrap.admin-password}") String password) {
        return args -> {
            if (email.isBlank() || password.isBlank()) {
                throw new IllegalStateException(
                        "Bootstrap is enabled but FORGEOPS_BOOTSTRAP_ADMIN_EMAIL/PASSWORD are missing");
            }
            if (password.length() < 12) {
                throw new IllegalStateException("Bootstrap administrator password must be at least 12 characters");
            }
            createIfMissing(userRepository, passwordEncoder, email.trim().toLowerCase(), password);
        };
    }

    /**
     * Creates the initial account exactly once and never resets an existing password.
     */
    private void createIfMissing(UserRepository userRepository, PasswordEncoder passwordEncoder,
                                 String email, String rawPassword) {
        userRepository.findByEmail(email).ifPresentOrElse(
            user -> log.info("[DatabaseInitializer] Bootstrap user already exists; no changes applied"),
            () -> {
                User newUser = new User(email, passwordEncoder.encode(rawPassword));
                newUser.setRole(UserRole.ADMIN);
                userRepository.save(newUser);
                log.info("[DatabaseInitializer] Created bootstrap administrator account");
            }
        );
    }
}
