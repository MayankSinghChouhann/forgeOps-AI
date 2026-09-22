package com.forgeops.backend.terminal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ExplainCommandRequest {

    @NotBlank(message = "Command to explain is required")
    @Size(max = 2_000, message = "Command must not exceed 2,000 characters")
    private String command;

    public ExplainCommandRequest() {}
    public ExplainCommandRequest(String command) { this.command = command; }

    public String getCommand() { return command; }
    public void setCommand(String command) { this.command = command; }
}
