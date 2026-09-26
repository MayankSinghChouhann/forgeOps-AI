package com.forgeops.backend.auth.dto;

import com.forgeops.backend.auth.entity.UserRole;
import com.forgeops.backend.auth.security.Permission;

import java.util.Set;

public record AuthResponse(
        String accessToken,
        String tokenType,
        String email,
        UserRole role,
        Set<Permission> permissions
) {
    public AuthResponse(String accessToken, String email, UserRole role, Set<Permission> permissions) {
        this(accessToken, "Bearer", email, role, Set.copyOf(permissions));
    }
}
