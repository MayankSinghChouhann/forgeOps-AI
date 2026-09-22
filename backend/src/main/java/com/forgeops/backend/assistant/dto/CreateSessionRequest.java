package com.forgeops.backend.assistant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSessionRequest(
    @NotBlank(message = "Session title cannot be empty")
    @Size(max = 120, message = "Session title must not exceed 120 characters")
    String title
) {}
