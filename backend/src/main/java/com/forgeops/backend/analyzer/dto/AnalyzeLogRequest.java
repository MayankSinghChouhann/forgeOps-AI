package com.forgeops.backend.analyzer.dto;

import jakarta.validation.constraints.NotBlank;

public class AnalyzeLogRequest {

    @NotBlank(message = "Raw log content is required")
    private String rawLog;

    private String targetType = "JENKINS"; // JENKINS, DOCKER, KUBERNETES

    private String title;

    public AnalyzeLogRequest() {}

    public AnalyzeLogRequest(String rawLog, String targetType, String title) {
        this.rawLog = rawLog;
        this.targetType = targetType;
        this.title = title;
    }

    public String getRawLog() { return rawLog; }
    public void setRawLog(String rawLog) { this.rawLog = rawLog; }
    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
}
