package com.forgeops.backend.analyzer.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "analysis_records")
public class AnalysisRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "target_type", nullable = false, length = 50)
    private String targetType; // JENKINS, DOCKER, KUBERNETES, SYSTEM

    @Column(length = 200)
    private String title;

    @Column(name = "raw_log", columnDefinition = "TEXT", nullable = false)
    private String rawLog;

    @Column(name = "error_summary", columnDefinition = "TEXT")
    private String errorSummary;

    @Column(name = "root_cause", columnDefinition = "TEXT")
    private String rootCause;

    @Column(name = "failure_stage", length = 100)
    private String failureStage;

    @Column(length = 50)
    private String severity; // CRITICAL, HIGH, MEDIUM, LOW

    @Column(name = "remediation_script", columnDefinition = "TEXT")
    private String remediationScript;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public AnalysisRecord() {}

    public AnalysisRecord(Long userId, String targetType, String title, String rawLog,
                          String errorSummary, String rootCause, String failureStage,
                          String severity, String remediationScript) {
        this.userId = userId;
        this.targetType = targetType;
        this.title = title;
        this.rawLog = rawLog;
        this.errorSummary = errorSummary;
        this.rootCause = rootCause;
        this.failureStage = failureStage;
        this.severity = severity;
        this.remediationScript = remediationScript;
    }

    public UUID getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getRawLog() { return rawLog; }
    public void setRawLog(String rawLog) { this.rawLog = rawLog; }
    public String getErrorSummary() { return errorSummary; }
    public void setErrorSummary(String errorSummary) { this.errorSummary = errorSummary; }
    public String getRootCause() { return rootCause; }
    public void setRootCause(String rootCause) { this.rootCause = rootCause; }
    public String getFailureStage() { return failureStage; }
    public void setFailureStage(String failureStage) { this.failureStage = failureStage; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getRemediationScript() { return remediationScript; }
    public void setRemediationScript(String remediationScript) { this.remediationScript = remediationScript; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
