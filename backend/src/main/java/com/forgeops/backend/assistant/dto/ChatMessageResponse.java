package com.forgeops.backend.assistant.dto;

import java.time.LocalDateTime;

public record ChatMessageResponse(
    Long id,
    String role,
    String content,
    LocalDateTime createdAt
) {}
