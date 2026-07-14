package com.forgeops.backend.auth.service;

import com.forgeops.backend.auth.dto.AuthResponse;
import com.forgeops.backend.auth.dto.LoginRequest;
import com.forgeops.backend.auth.dto.RegisterRequest;
import com.forgeops.backend.auth.dto.TokenRefreshRequest;
import com.forgeops.backend.auth.entity.RefreshToken;
import com.forgeops.backend.auth.entity.User;
import com.forgeops.backend.auth.repository.RefreshTokenRepository;
import com.forgeops.backend.auth.repository.UserRepository;
import com.forgeops.backend.auth.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

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

    public void registerUser(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.email())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        User user = new User(registerRequest.email(), passwordEncoder.encode(registerRequest.password()));
        userRepository.save(user);
    }

    public AuthResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.email(), loginRequest.password())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtil.generateJwtToken(authentication);

        org.springframework.security.core.userdetails.User userDetails = (org.springframework.security.core.userdetails.User) authentication.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow(() -> new RuntimeException("User not found"));

        RefreshToken refreshToken = createRefreshToken(user);

        return new AuthResponse(jwt, refreshToken.getTokenHash(), userDetails.getUsername());
    }

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        refreshTokenRepository.deleteByUser(user); // Invalidating old refresh tokens for simplicity
        
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setExpiresAt(LocalDateTime.now().plusNanos(refreshTokenDurationMs * 1000000));
        refreshToken.setTokenHash(UUID.randomUUID().toString()); // Usually hashed, using UUID as token for demo
        refreshToken.setRevoked(false);

        return refreshTokenRepository.save(refreshToken);
    }

    public AuthResponse refreshToken(TokenRefreshRequest request) {
        String requestRefreshToken = request.refreshToken();

        return refreshTokenRepository.findByTokenHash(requestRefreshToken)
                .map(this::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String token = jwtUtil.generateTokenFromUsername(user.getEmail());
                    return new AuthResponse(token, requestRefreshToken, user.getEmail());
                })
                .orElseThrow(() -> new RuntimeException("Refresh token is not in database!"));
    }

    private RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token was expired. Please make a new signin request");
        }
        return token;
    }
}
