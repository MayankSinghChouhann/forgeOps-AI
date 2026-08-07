package com.forgeops.backend.generator.dto;

import jakarta.validation.constraints.NotBlank;

public class GenerateTemplateRequest {

    @NotBlank(message = "Template type is required (e.g. TERRAFORM, KUBERNETES, GITLAB_CI, GITHUB_ACTIONS, DOCKERFILE)")
    private String templateType;

    private String targetProvider = "AWS"; // AWS, GCP, K8S, GENERIC
    private String serviceName = "forgeops-service";
    private String environment = "production";
    private String runtime = "java"; // java, node, go, python
    private boolean enablePostgres = true;
    private boolean enableRedis = true;
    private boolean enableMonitoring = true;
    private String customPrompt;

    public GenerateTemplateRequest() {}

    public String getTemplateType() { return templateType; }
    public void setTemplateType(String templateType) { this.templateType = templateType; }
    public String getTargetProvider() { return targetProvider; }
    public void setTargetProvider(String targetProvider) { this.targetProvider = targetProvider; }
    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
    public String getEnvironment() { return environment; }
    public void setEnvironment(String environment) { this.environment = environment; }
    public String getRuntime() { return runtime; }
    public void setRuntime(String runtime) { this.runtime = runtime; }
    public boolean isEnablePostgres() { return enablePostgres; }
    public void setEnablePostgres(boolean enablePostgres) { this.enablePostgres = enablePostgres; }
    public boolean isEnableRedis() { return enableRedis; }
    public void setEnableRedis(boolean enableRedis) { this.enableRedis = enableRedis; }
    public boolean isEnableMonitoring() { return enableMonitoring; }
    public void setEnableMonitoring(boolean enableMonitoring) { this.enableMonitoring = enableMonitoring; }
    public String getCustomPrompt() { return customPrompt; }
    public void setCustomPrompt(String customPrompt) { this.customPrompt = customPrompt; }
}
