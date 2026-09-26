package com.forgeops.backend.terminal.controller;

import com.forgeops.backend.terminal.dto.CommandExplanationResponse;
import com.forgeops.backend.terminal.dto.ExplainCommandRequest;
import com.forgeops.backend.terminal.dto.GenerateCommandRequest;
import com.forgeops.backend.terminal.dto.GeneratedCommandResponse;
import com.forgeops.backend.terminal.service.ShellSafetyService;
import com.forgeops.backend.operation.dto.OperationResponse;
import com.forgeops.backend.operation.service.OperationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/terminal")
public class TerminalController {

    private final ShellSafetyService shellSafetyService;
    private final OperationService operationService;

    public TerminalController(ShellSafetyService shellSafetyService, OperationService operationService) {
        this.shellSafetyService = shellSafetyService;
        this.operationService = operationService;
    }

    @PostMapping("/explain")
    @PreAuthorize("hasAuthority('AI_USE')")
    public ResponseEntity<CommandExplanationResponse> explainCommand(@Valid @RequestBody ExplainCommandRequest request) {
        CommandExplanationResponse response = shellSafetyService.explainCommand(request.getCommand());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/generate")
    @PreAuthorize("hasAuthority('COMMAND_RECOMMEND')")
    public ResponseEntity<GeneratedCommandResponse> generateCommand(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody GenerateCommandRequest request) {
        GeneratedCommandResponse generated = shellSafetyService.generateCommand(request.getPrompt());
        OperationResponse operation = operationService.createRecommendation(
                user.getUsername(), generated.result(), generated.safetyLevel());
        return ResponseEntity.ok(new GeneratedCommandResponse(
                operation.recommendation(), generated.safetyLevel(), generated.riskExplanation(),
                generated.safeAlternative(), operation.id(), operation.status(), operation.correlationId()));
    }
}
