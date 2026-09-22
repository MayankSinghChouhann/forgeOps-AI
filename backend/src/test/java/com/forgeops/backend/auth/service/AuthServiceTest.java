package com.forgeops.backend.auth.service;

import com.forgeops.backend.auth.dto.AuthResponse;
import com.forgeops.backend.auth.dto.RegisterRequest;
import com.forgeops.backend.auth.dto.TokenRefreshRequest;
import com.forgeops.backend.auth.entity.RefreshToken;
import com.forgeops.backend.auth.entity.User;
import com.forgeops.backend.auth.repository.RefreshTokenRepository;
import com.forgeops.backend.auth.repository.UserRepository;
import com.forgeops.backend.auth.security.JwtUtil;
import com.forgeops.backend.common.exception.BusinessRuleViolationException;
import com.forgeops.backend.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * AuthServiceTest — Unit Tests for Authentication & Token Lifecycle
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService — Authentication & Token Lifecycle Unit Tests")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "refreshTokenDurationMs", 86400000L);
    }

    @Nested
    @DisplayName("User Registration")
    class UserRegistrationTests {

        @Test
        @DisplayName("registerUser: new email -> encodes password and saves user")
        void registerUser_GivenNewEmail_EncodesPasswordAndSaves() {
            RegisterRequest request = new RegisterRequest("devops@forgeops.io", "password123");
            when(userRepository.existsByEmail("devops@forgeops.io")).thenReturn(false);
            when(passwordEncoder.encode("password123")).thenReturn("encodedPasswordHash");

            authService.registerUser(request);

            verify(userRepository, times(1)).save(any(User.class));
            verify(passwordEncoder, times(1)).encode("password123");
        }

        @Test
        @DisplayName("registerUser: duplicate email -> throws BusinessRuleViolationException")
        void registerUser_GivenDuplicateEmail_ThrowsBusinessRuleViolationException() {
            RegisterRequest request = new RegisterRequest("admin@forgeops.io", "password123");
            when(userRepository.existsByEmail("admin@forgeops.io")).thenReturn(true);

            assertThatThrownBy(() -> authService.registerUser(request))
                    .isInstanceOf(BusinessRuleViolationException.class)
                    .hasMessageContaining("Email address is already registered");

            verify(userRepository, never()).save(any(User.class));
        }
    }

    @Nested
    @DisplayName("Refresh Token Lifecycle")
    class RefreshTokenLifecycleTests {

        @Test
        @DisplayName("refreshToken: valid token -> returns new JWT with same refresh token")
        void refreshToken_GivenValidToken_ReturnsNewJwt() {
            String rawRefreshToken = "sample-valid-refresh-token";
            User mockUser = new User("admin@forgeops.io", "encodedPass");
            RefreshToken storedToken = new RefreshToken();
            storedToken.setUser(mockUser);
            storedToken.setTokenHash(hashToken(rawRefreshToken));
            storedToken.setExpiresAt(LocalDateTime.now().plusDays(1));

            when(refreshTokenRepository.findByTokenHash(hashToken(rawRefreshToken))).thenReturn(Optional.of(storedToken));
            when(jwtUtil.generateTokenFromUsername("admin@forgeops.io")).thenReturn("new-mock-jwt-token");

            AuthResponse response = authService.refreshToken(new TokenRefreshRequest(rawRefreshToken));

            assertThat(response).isNotNull();
            assertThat(response.accessToken()).isEqualTo("new-mock-jwt-token");
            assertThat(response.email()).isEqualTo("admin@forgeops.io");
            assertThat(response.refreshToken()).isNotBlank().isNotEqualTo(rawRefreshToken);
        }

        @Test
        @DisplayName("refreshToken: expired token -> deletes token and throws BusinessRuleViolationException")
        void refreshToken_GivenExpiredToken_DeletesTokenAndThrowsException() {
            String rawRefreshToken = "expired-token";
            RefreshToken expiredToken = new RefreshToken();
            expiredToken.setTokenHash(hashToken(rawRefreshToken));
            expiredToken.setExpiresAt(LocalDateTime.now().minusHours(2));

            when(refreshTokenRepository.findByTokenHash(hashToken(rawRefreshToken))).thenReturn(Optional.of(expiredToken));

            assertThatThrownBy(() -> authService.refreshToken(new TokenRefreshRequest(rawRefreshToken)))
                    .isInstanceOf(BusinessRuleViolationException.class)
                    .hasMessageContaining("expired or revoked");

            verify(refreshTokenRepository, times(1)).delete(expiredToken);
        }

        @Test
        @DisplayName("refreshToken: non-existent token -> throws ResourceNotFoundException")
        void refreshToken_GivenNonExistentToken_ThrowsResourceNotFoundException() {
            when(refreshTokenRepository.findByTokenHash(hashToken("missing-token"))).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.refreshToken(new TokenRefreshRequest("missing-token")))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Refresh token");
        }
    }

    private static String hashToken(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

        @Test
        @DisplayName("logout: raw token -> deletes only its SHA-256 hash")
        void logout_DeletesHashedToken() {
            String rawToken = "logout-token";

            authService.logout(new TokenRefreshRequest(rawToken));

            verify(refreshTokenRepository).deleteByTokenHash(hashToken(rawToken));
        }

        @Test
        @DisplayName("refreshToken: revoked token -> deletes token and rejects refresh")
        void refreshToken_GivenRevokedToken_RejectsRefresh() {
            String rawToken = "revoked-token";
            RefreshToken revokedToken = new RefreshToken();
            revokedToken.setTokenHash(hashToken(rawToken));
            revokedToken.setExpiresAt(LocalDateTime.now().plusHours(1));
            revokedToken.setRevoked(true);
            when(refreshTokenRepository.findByTokenHash(hashToken(rawToken))).thenReturn(Optional.of(revokedToken));

            assertThatThrownBy(() -> authService.refreshToken(new TokenRefreshRequest(rawToken)))
                    .isInstanceOf(BusinessRuleViolationException.class)
                    .hasMessageContaining("revoked");

            verify(refreshTokenRepository).delete(revokedToken);
        }
}
