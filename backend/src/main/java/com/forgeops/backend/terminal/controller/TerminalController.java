package com.forgeops.backend.terminal.controller;

import com.forgeops.backend.terminal.dto.CommandExplanationResponse;
import com.forgeops.backend.terminal.dto.ExplainCommandRequest;
import com.forgeops.backend.terminal.dto.GenerateCommandRequest;
import com.forgeops.backend.terminal.dto.GeneratedCommandResponse;
import com.forgeops.backend.terminal.service.ShellSafetyService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/terminal")
public class TerminalController {

    private final ShellSafetyService shellSafetyService;

    public TerminalController(ShellSafetyService shellSafetyService) {
        this.shellSafetyService = shellSafetyService;
    }

    @PostMapping("/explain")
    public ResponseEntity<CommandExplanationResponse> explainCommand(@Valid @RequestBody ExplainCommandRequest request) {
        CommandExplanationResponse response = shellSafetyService.explainCommand(request.getCommand());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/generate")
    public ResponseEntity<GeneratedCommandResponse> generateCommand(@Valid @RequestBody GenerateCommandRequest request) {
        return ResponseEntity.ok(shellSafetyService.generateCommand(request.getPrompt()));
    }
}
