package com.forgeops.backend.operation.dto;

import com.forgeops.backend.operation.entity.OperationStatus;
import com.forgeops.backend.operation.entity.RiskLevel;

import java.time.LocalDateTime;
import java.util.UUID;

public record OperationResponse(
        UUID id,
        String requester,
        String approver,
        String recommendation,
        RiskLevel riskLevel,
        OperationStatus status,
        String correlationId,
        String decisionReason,
        String resultSummary,
        LocalDateTime approvalExpiresAt,
        LocalDateTime decidedAt,
        LocalDateTime executionStartedAt,
        LocalDateTime completedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
