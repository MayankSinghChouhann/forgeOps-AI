package com.forgeops.backend.audit.dto;

import com.forgeops.backend.auth.entity.UserRole;

import java.time.LocalDateTime;
import java.util.UUID;

public record AuditEventResponse(
        UUID id,
        String actorEmail,
        UserRole actorRole,
        String action,
        String resourceType,
        String resourceId,
        String correlationId,
        boolean success,
        String metadata,
        LocalDateTime createdAt
) {}
