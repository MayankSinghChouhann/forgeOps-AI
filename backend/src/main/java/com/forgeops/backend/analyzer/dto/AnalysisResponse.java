package com.forgeops.backend.analyzer.dto;

import com.forgeops.backend.analyzer.entity.AnalysisRecord;

import java.time.LocalDateTime;
import java.util.UUID;

public class AnalysisResponse {

    private UUID id;
    private String targetType;
    private String title;
    private String rawLog;
    private String errorSummary;
    private String rootCause;
    private String failureStage;
    private String severity;
    private String remediationScript;
    private LocalDateTime createdAt;

    public AnalysisResponse() {}

    public static AnalysisResponse fromEntity(AnalysisRecord entity) {
        AnalysisResponse resp = new AnalysisResponse();
        resp.id = entity.getId();
        resp.targetType = entity.getTargetType();
        resp.title = entity.getTitle();
        resp.rawLog = entity.getRawLog();
        resp.errorSummary = entity.getErrorSummary();
        resp.rootCause = entity.getRootCause();
        resp.failureStage = entity.getFailureStage();
        resp.severity = entity.getSeverity();
        resp.remediationScript = entity.getRemediationScript();
        resp.createdAt = entity.getCreatedAt();
        return resp;
    }

    public UUID getId() { return id; }
    public String getTargetType() { return targetType; }
    public String getTitle() { return title; }
    public String getRawLog() { return rawLog; }
    public String getErrorSummary() { return errorSummary; }
    public String getRootCause() { return rootCause; }
    public String getFailureStage() { return failureStage; }
    public String getSeverity() { return severity; }
    public String getRemediationScript() { return remediationScript; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
