package com.forgeops.backend.auth.dto;

import com.forgeops.backend.auth.entity.UserRole;
import jakarta.validation.constraints.NotNull;

public record UpdateRoleRequest(@NotNull UserRole role) {}
