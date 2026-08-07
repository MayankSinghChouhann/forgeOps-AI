package com.forgeops.backend.generator.controller;

import com.forgeops.backend.auth.entity.User;
import com.forgeops.backend.auth.repository.UserRepository;
import com.forgeops.backend.generator.dto.GenerateTemplateRequest;
import com.forgeops.backend.generator.dto.TemplateResponse;
import com.forgeops.backend.generator.service.TemplateGeneratorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/generator")
public class GeneratorController {

    private final TemplateGeneratorService templateGeneratorService;
    private final UserRepository userRepository;

    public GeneratorController(TemplateGeneratorService templateGeneratorService, UserRepository userRepository) {
        this.templateGeneratorService = templateGeneratorService;
        this.userRepository = userRepository;
    }

    @PostMapping("/generate")
    public ResponseEntity<TemplateResponse> generateTemplate(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody GenerateTemplateRequest request) {
        Long userId = resolveUserId(userDetails);
        TemplateResponse response = templateGeneratorService.generateTemplate(userId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<TemplateResponse>> getHistory(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        List<TemplateResponse> history = templateGeneratorService.getUserHistory(userId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TemplateResponse> getTemplateById(@PathVariable UUID id) {
        TemplateResponse response = templateGeneratorService.getTemplateById(id);
        return ResponseEntity.ok(response);
    }

    private Long resolveUserId(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElse(null);
    }
}
