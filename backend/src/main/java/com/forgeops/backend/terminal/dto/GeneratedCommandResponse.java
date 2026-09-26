package com.forgeops.backend.terminal.dto;

import com.forgeops.backend.operation.entity.OperationStatus;

import java.util.UUID;

public record GeneratedCommandResponse(
        String result,
        String safetyLevel,
        String riskExplanation,
        String safeAlternative,
        UUID operationId,
        OperationStatus operationStatus,
        String correlationId
) {
    public GeneratedCommandResponse(String result, String safetyLevel, String riskExplanation, String safeAlternative) {
        this(result, safetyLevel, riskExplanation, safeAlternative, null, null, null);
    }
}
