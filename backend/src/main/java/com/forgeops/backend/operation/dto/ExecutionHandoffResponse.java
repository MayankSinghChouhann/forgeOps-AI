package com.forgeops.backend.operation.dto;

import java.util.UUID;

public record ExecutionHandoffResponse(
        UUID operationId,
        String recommendation,
        String idempotencyKey,
        String correlationId,
        String instruction
) {}
