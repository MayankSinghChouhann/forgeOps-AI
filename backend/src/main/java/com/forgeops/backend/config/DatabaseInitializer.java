package com.forgeops.backend.config;

import com.forgeops.backend.auth.entity.User;
import com.forgeops.backend.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

/**
 * DatabaseInitializer — Seeds default admin users on every startup.
 *
 * Default Credentials:
 *   Admin : admin@forgeops.ai / root123
 *   Dev   : mayank@forgeops.ai / root123
 *
 * IMPORTANT: This always force-updates the password on every restart.
 * This ensures that if you change the password here, containers pick it up
 * without needing to wipe the database.
 */
@Configuration
public class DatabaseInitializer {

    private static final Logger log = LoggerFactory.getLogger(DatabaseInitializer.class);

    // =====================================================
    // DEFAULT CREDENTIALS — Change here to update globally
    // =====================================================
    private static final String DEFAULT_ADMIN_EMAIL    = "admin@forgeops.ai";
    private static final String DEFAULT_DEV_EMAIL      = "mayank@forgeops.ai";
    private static final String DEFAULT_PASSWORD       = "root123";

    @Bean
    @Transactional
    public CommandLineRunner initDefaultUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            upsertUser(userRepository, passwordEncoder, DEFAULT_ADMIN_EMAIL, DEFAULT_PASSWORD);
            upsertUser(userRepository, passwordEncoder, DEFAULT_DEV_EMAIL, DEFAULT_PASSWORD);
        };
    }

    /**
     * Creates the user if they don't exist, or force-updates their password if they do.
     * This ensures default credentials are always correct after a redeploy.
     */
    private void upsertUser(UserRepository userRepository, PasswordEncoder passwordEncoder,
                            String email, String rawPassword) {
        userRepository.findByEmail(email).ifPresentOrElse(
            user -> {
                user.setPasswordHash(passwordEncoder.encode(rawPassword));
                userRepository.save(user);
                log.info("[DatabaseInitializer] Password reset for: {}", email);
            },
            () -> {
                User newUser = new User(email, passwordEncoder.encode(rawPassword));
                userRepository.save(newUser);
                log.info("[DatabaseInitializer] Created seed user: {}", email);
            }
        );
    }
}
