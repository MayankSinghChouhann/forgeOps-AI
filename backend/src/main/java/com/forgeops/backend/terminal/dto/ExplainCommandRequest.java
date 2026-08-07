package com.forgeops.backend.terminal.dto;

import jakarta.validation.constraints.NotBlank;

public class ExplainCommandRequest {

    @NotBlank(message = "Command to explain is required")
    private String command;

    public ExplainCommandRequest() {}
    public ExplainCommandRequest(String command) { this.command = command; }

    public String getCommand() { return command; }
    public void setCommand(String command) { this.command = command; }
}
