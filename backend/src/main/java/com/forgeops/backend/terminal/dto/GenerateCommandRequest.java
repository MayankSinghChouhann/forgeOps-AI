package com.forgeops.backend.terminal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class GenerateCommandRequest {

    @NotBlank(message = "Goal or prompt is required")
    @Size(max = 2_000, message = "Goal or prompt must not exceed 2,000 characters")
    private String prompt;

    public GenerateCommandRequest() {}
    public GenerateCommandRequest(String prompt) { this.prompt = prompt; }

    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }
}
