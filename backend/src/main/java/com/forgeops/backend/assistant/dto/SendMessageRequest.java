package com.forgeops.backend.assistant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record SendMessageRequest(
    UUID sessionId,
    @NotBlank(message = "Prompt cannot be empty")
    @Size(max = 4_000, message = "Prompt must not exceed 4,000 characters")
    String prompt
) {}
