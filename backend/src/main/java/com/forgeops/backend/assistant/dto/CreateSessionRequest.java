package com.forgeops.backend.assistant.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateSessionRequest(
    @NotBlank(message = "Session title cannot be empty")
    String title
) {}
