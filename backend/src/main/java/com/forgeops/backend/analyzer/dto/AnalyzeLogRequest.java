package com.forgeops.backend.analyzer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AnalyzeLogRequest {

    @NotBlank(message = "Raw log content is required")
    @Size(max = 20_000, message = "Raw log content must not exceed 20,000 characters")
    private String rawLog;

    @Size(max = 32, message = "Target type must not exceed 32 characters")
    private String targetType = "JENKINS"; // JENKINS, DOCKER, KUBERNETES

    @Size(max = 200, message = "Title must not exceed 200 characters")
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
