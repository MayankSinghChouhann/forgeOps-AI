package com.forgeops.backend.assistant.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record SendMessageRequest(
    UUID sessionId,
    @NotBlank(message = "Prompt cannot be empty")
    String prompt
) {}
