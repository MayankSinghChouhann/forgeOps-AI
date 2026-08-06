package com.forgeops.backend.config;

import com.forgeops.backend.auth.entity.User;
import com.forgeops.backend.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DatabaseInitializer {

    private static final Logger log = LoggerFactory.getLogger(DatabaseInitializer.class);

    @Bean
    public CommandLineRunner initDefaultUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            seedUserIfNotExists(userRepository, passwordEncoder, "admin@forgeops.ai", "password123");
            seedUserIfNotExists(userRepository, passwordEncoder, "mayank@forgeops.ai", "password123");
        };
    }

    private void seedUserIfNotExists(UserRepository userRepository, PasswordEncoder passwordEncoder, String email, String rawPassword) {
        userRepository.findByEmail(email).ifPresentOrElse(
            user -> {
                user.setPasswordHash(passwordEncoder.encode(rawPassword));
                userRepository.save(user);
                log.info("Updated password for seed user: {}", email);
            },
            () -> {
                User newUser = new User(email, passwordEncoder.encode(rawPassword));
                userRepository.save(newUser);
                log.info("Created default seed user: {}", email);
            }
        );
    }
}
