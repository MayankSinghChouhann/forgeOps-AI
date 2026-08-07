package com.forgeops.backend.generator.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "generated_templates")
public class GeneratedTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "template_type", nullable = false, length = 50)
    private String templateType; // TERRAFORM, KUBERNETES, GITLAB_CI, GITHUB_ACTIONS, DOCKERFILE, HELM

    @Column(name = "target_provider", length = 50)
    private String targetProvider; // AWS, GCP, AZURE, K8S, GENERIC

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 500)
    private String description;

    @Column(name = "code_content", columnDefinition = "TEXT", nullable = false)
    private String codeContent;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public GeneratedTemplate() {}

    public GeneratedTemplate(Long userId, String templateType, String targetProvider,
                             String title, String description, String codeContent) {
        this.userId = userId;
        this.templateType = templateType;
        this.targetProvider = targetProvider;
        this.title = title;
        this.description = description;
        this.codeContent = codeContent;
    }

    public UUID getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getTemplateType() { return templateType; }
    public void setTemplateType(String templateType) { this.templateType = templateType; }
    public String getTargetProvider() { return targetProvider; }
    public void setTargetProvider(String targetProvider) { this.targetProvider = targetProvider; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCodeContent() { return codeContent; }
    public void setCodeContent(String codeContent) { this.codeContent = codeContent; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
