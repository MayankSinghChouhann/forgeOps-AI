package com.forgeops.backend.operation.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ApprovalDecisionRequest(
        @NotNull Boolean approved,
        @Size(max = 1_000) String reason
) {}
