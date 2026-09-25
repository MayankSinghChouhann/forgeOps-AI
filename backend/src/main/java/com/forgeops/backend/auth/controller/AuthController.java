package com.forgeops.backend.auth.controller;

import com.forgeops.backend.auth.dto.AuthResponse;
import com.forgeops.backend.auth.dto.LoginRequest;
import com.forgeops.backend.auth.dto.RegisterRequest;
import com.forgeops.backend.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

/**
 * AuthController — Authentication Endpoints
 *
 * Design Note:
 *  All exception handling is intentionally ABSENT here.
 *  This is a CLEAN CONTROLLER — it only handles HTTP routing and input validation.
 *
 *  The GlobalExceptionHandler (@RestControllerAdvice) intercepts all
 *  domain exceptions thrown from AuthService and converts them to
 *  RFC 7807 Problem Detail responses automatically.
 *
 *  Before: try/catch in every method = scattered error handling = code smell
 *  After:  throw typed exceptions in service, handle once in GlobalExceptionHandler
 *
 *  This follows the Single Responsibility Principle (SRP):
 *    - Controller: routing + request/response mapping
 *    - Service: business logic + exceptions
 *    - GlobalExceptionHandler: exception → HTTP response mapping
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    static final String REFRESH_COOKIE_NAME = "forgeops_refresh";

    private final AuthService authService;
    private final boolean secureRefreshCookie;
    private final Duration refreshCookieLifetime;

    public AuthController(AuthService authService,
                          @Value("${forgeops.auth.refresh-cookie-secure:false}") boolean secureRefreshCookie,
                          @Value("${forgeops.app.jwtRefreshExpirationMs}") long refreshTokenDurationMs) {
        this.authService = authService;
        this.secureRefreshCookie = secureRefreshCookie;
        this.refreshCookieLifetime = Duration.ofMillis(refreshTokenDurationMs);
    }

    /**
     * POST /api/auth/register
     * Returns 201 Created on success.
     * BusinessRuleViolationException (409 Conflict) handled by GlobalExceptionHandler.
     */
    @PostMapping("/register")
    public ResponseEntity<Void> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        authService.registerUser(registerRequest);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /**
     * POST /api/auth/login
     * Returns 200 OK with JWT + refresh token on success.
     * AuthenticationException (401 Unauthorized) handled by GlobalExceptionHandler.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        AuthService.AuthSession session = authService.authenticateUser(loginRequest);
        return authenticatedResponse(session);
    }

    /**
     * POST /api/auth/refresh
     * Returns 200 OK with new JWT on success.
     * ResourceNotFoundException (404) and BusinessRuleViolationException (409)
     * both handled by GlobalExceptionHandler.
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken) {
        AuthService.AuthSession session = authService.refreshToken(requireRefreshToken(refreshToken));
        return authenticatedResponse(session);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            authService.logout(refreshToken);
        }
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, refreshCookie("").maxAge(Duration.ZERO).build().toString())
                .cacheControl(CacheControl.noStore())
                .build();
    }

    private ResponseEntity<AuthResponse> authenticatedResponse(AuthService.AuthSession session) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie(session.refreshToken()).build().toString())
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.PRAGMA, "no-cache")
                .body(session.response());
    }

    private ResponseCookie.ResponseCookieBuilder refreshCookie(String value) {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, value)
                .httpOnly(true)
                .secure(secureRefreshCookie)
                .sameSite("Strict")
                .path("/api/auth")
                .maxAge(refreshCookieLifetime);
    }

    private String requireRefreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BadCredentialsException("Refresh session is missing or expired.");
        }
        return refreshToken;
    }
}
