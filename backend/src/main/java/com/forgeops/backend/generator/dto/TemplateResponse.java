package com.forgeops.backend.generator.dto;

import com.forgeops.backend.generator.entity.GeneratedTemplate;

import java.time.LocalDateTime;
import java.util.UUID;

public class TemplateResponse {

    private UUID id;
    private String templateType;
    private String targetProvider;
    private String title;
    private String description;
    private String codeContent;
    private LocalDateTime createdAt;

    public TemplateResponse() {}

    public static TemplateResponse fromEntity(GeneratedTemplate entity) {
        TemplateResponse resp = new TemplateResponse();
        resp.id = entity.getId();
        resp.templateType = entity.getTemplateType();
        resp.targetProvider = entity.getTargetProvider();
        resp.title = entity.getTitle();
        resp.description = entity.getDescription();
        resp.codeContent = entity.getCodeContent();
        resp.createdAt = entity.getCreatedAt();
        return resp;
    }

    public UUID getId() { return id; }
    public String getTemplateType() { return templateType; }
    public String getTargetProvider() { return targetProvider; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getCodeContent() { return codeContent; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
