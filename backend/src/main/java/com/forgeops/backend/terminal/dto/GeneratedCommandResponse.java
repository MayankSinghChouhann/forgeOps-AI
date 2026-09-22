package com.forgeops.backend.terminal.dto;

public record GeneratedCommandResponse(
        String result,
        String safetyLevel,
        String riskExplanation,
        String safeAlternative
) {}
