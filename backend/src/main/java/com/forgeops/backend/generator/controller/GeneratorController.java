package com.forgeops.backend.generator.controller;

import com.forgeops.backend.auth.service.CurrentUserService;
import com.forgeops.backend.generator.dto.GenerateTemplateRequest;
import com.forgeops.backend.generator.dto.TemplateResponse;
import com.forgeops.backend.generator.service.TemplateGeneratorService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api/generator")
@Validated
public class GeneratorController {

    private final TemplateGeneratorService templateGeneratorService;
    private final CurrentUserService currentUserService;

    public GeneratorController(TemplateGeneratorService templateGeneratorService, CurrentUserService currentUserService) {
        this.templateGeneratorService = templateGeneratorService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/generate")
    public ResponseEntity<TemplateResponse> generateTemplate(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody GenerateTemplateRequest request) {
        Long userId = currentUserService.requireId(userDetails.getUsername());
        TemplateResponse response = templateGeneratorService.generateTemplate(userId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<TemplateResponse>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        Long userId = currentUserService.requireId(userDetails.getUsername());
        List<TemplateResponse> history = templateGeneratorService.getUserHistory(userId, PageRequest.of(page, size));
        return ResponseEntity.ok(history);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TemplateResponse> getTemplateById(
            @AuthenticationPrincipal UserDetails userDetails, @PathVariable UUID id) {
        Long userId = currentUserService.requireId(userDetails.getUsername());
        TemplateResponse response = templateGeneratorService.getTemplateById(userId, id);
        return ResponseEntity.ok(response);
    }
}
