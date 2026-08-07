package com.forgeops.backend.auth.controller;

import com.forgeops.backend.auth.dto.AuthResponse;
import com.forgeops.backend.auth.dto.LoginRequest;
import com.forgeops.backend.auth.dto.RegisterRequest;
import com.forgeops.backend.auth.dto.TokenRefreshRequest;
import com.forgeops.backend.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
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
        AuthResponse authResponse = authService.authenticateUser(loginRequest);
        return ResponseEntity.ok(authResponse);
    }

    /**
     * POST /api/auth/refresh
     * Returns 200 OK with new JWT on success.
     * ResourceNotFoundException (404) and BusinessRuleViolationException (409)
     * both handled by GlobalExceptionHandler.
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }
}
