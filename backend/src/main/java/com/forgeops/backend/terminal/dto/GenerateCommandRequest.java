package com.forgeops.backend.terminal.dto;

import jakarta.validation.constraints.NotBlank;

public class GenerateCommandRequest {

    @NotBlank(message = "Goal or prompt is required")
    private String prompt;

    public GenerateCommandRequest() {}
    public GenerateCommandRequest(String prompt) { this.prompt = prompt; }

    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }
}
