package com.forgeops.backend.auth.dto;

public record AuthResponse(
        String accessToken,
        String tokenType,
        String email
) {
    public AuthResponse(String accessToken, String email) {
        this(accessToken, "Bearer", email);
    }
}
