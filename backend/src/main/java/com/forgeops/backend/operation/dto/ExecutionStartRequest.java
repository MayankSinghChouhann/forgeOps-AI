package com.forgeops.backend.operation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ExecutionStartRequest(
        @NotBlank
        @Size(min = 16, max = 100)
        @Pattern(regexp = "[A-Za-z0-9._:-]+", message = "Idempotency key contains unsupported characters")
        String idempotencyKey
) {}
