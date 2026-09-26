package com.forgeops.backend.auth.dto;

import com.forgeops.backend.auth.entity.UserRole;

import java.time.LocalDateTime;

public record UserResponse(Long id, String email, UserRole role, LocalDateTime createdAt) {}
