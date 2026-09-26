package com.forgeops.backend.auth.service;

import com.forgeops.backend.auth.dto.AuthResponse;
import com.forgeops.backend.auth.dto.LoginRequest;
import com.forgeops.backend.auth.dto.RegisterRequest;
import com.forgeops.backend.auth.entity.RefreshToken;
import com.forgeops.backend.auth.entity.User;
import com.forgeops.backend.auth.repository.RefreshTokenRepository;
import com.forgeops.backend.auth.repository.UserRepository;
import com.forgeops.backend.auth.security.JwtUtil;
import com.forgeops.backend.auth.security.RolePermissions;
import com.forgeops.backend.common.exception.BusinessRuleViolationException;
import com.forgeops.backend.common.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.UUID;
import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    @Value("${forgeops.app.jwtRefreshExpirationMs}")
    private Long refreshTokenDurationMs;

    public AuthService(UserRepository userRepository, RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public void registerUser(RegisterRequest registerRequest) {
        String email = canonicalEmail(registerRequest.email());
        if (userRepository.existsByEmail(email)) {
            throw new BusinessRuleViolationException("Email address is already registered: " + email);
        }

        User user = new User(email, passwordEncoder.encode(registerRequest.password()));
        userRepository.save(user);
    }

    @Transactional
    public AuthSession authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(canonicalEmail(loginRequest.email()), loginRequest.password())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtil.generateJwtToken(authentication);

        org.springframework.security.core.userdetails.User userDetails = (org.springframework.security.core.userdetails.User) authentication.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userDetails.getUsername()));

        IssuedRefreshToken refreshToken = createRefreshToken(user);

        return new AuthSession(new AuthResponse(jwt, userDetails.getUsername(), user.getRole(),
                RolePermissions.forRole(user.getRole())), refreshToken.rawToken());
    }

    @Transactional
    private IssuedRefreshToken createRefreshToken(User user) {
        refreshTokenRepository.deleteByUser(user); // Invalidating old refresh tokens for simplicity

        String rawToken = UUID.randomUUID().toString() + UUID.randomUUID();
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setExpiresAt(LocalDateTime.now().plusNanos(refreshTokenDurationMs * 1000000));
        refreshToken.setTokenHash(hashToken(rawToken));
        refreshToken.setRevoked(false);

        refreshTokenRepository.save(refreshToken);
        return new IssuedRefreshToken(rawToken);
    }

    @Transactional
    public AuthSession refreshToken(String rawRefreshToken) {
        return refreshTokenRepository.findByTokenHash(hashToken(rawRefreshToken))
                .map(this::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String token = jwtUtil.generateTokenFromUsername(user.getEmail());
                    IssuedRefreshToken rotatedToken = createRefreshToken(user);
                    return new AuthSession(
                            new AuthResponse(token, user.getEmail(), user.getRole(),
                                    RolePermissions.forRole(user.getRole())),
                            rotatedToken.rawToken());
                })
                .orElseThrow(() -> new BadCredentialsException("Refresh session is invalid or expired."));
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        refreshTokenRepository.deleteByTokenHash(hashToken(rawRefreshToken));
    }

    private RefreshToken verifyExpiration(RefreshToken token) {
        if (token.isRevoked() || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(token);
            throw new BadCredentialsException("Refresh session is invalid or expired.");
        }
        return token;
    }

    private String hashToken(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }

    private String canonicalEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private record IssuedRefreshToken(String rawToken) {}

    public record AuthSession(AuthResponse response, String refreshToken) {}
}
