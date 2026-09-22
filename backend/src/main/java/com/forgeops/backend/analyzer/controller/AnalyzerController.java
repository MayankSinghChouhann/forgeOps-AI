package com.forgeops.backend.analyzer.controller;

import com.forgeops.backend.analyzer.dto.AnalysisResponse;
import com.forgeops.backend.analyzer.dto.AnalyzeLogRequest;
import com.forgeops.backend.analyzer.service.LogAnalyzerService;
import com.forgeops.backend.auth.service.CurrentUserService;
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
@RequestMapping("/api/analyzer")
@Validated
public class AnalyzerController {

    private final LogAnalyzerService logAnalyzerService;
    private final CurrentUserService currentUserService;

    public AnalyzerController(LogAnalyzerService logAnalyzerService, CurrentUserService currentUserService) {
        this.logAnalyzerService = logAnalyzerService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<AnalysisResponse> analyzeLog(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AnalyzeLogRequest request) {
        Long userId = currentUserService.requireId(userDetails.getUsername());
        AnalysisResponse response = logAnalyzerService.analyzeLog(userId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<AnalysisResponse>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        Long userId = currentUserService.requireId(userDetails.getUsername());
        List<AnalysisResponse> history = logAnalyzerService.getUserHistory(userId, PageRequest.of(page, size));
        return ResponseEntity.ok(history);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnalysisResponse> getAnalysisById(
            @AuthenticationPrincipal UserDetails userDetails, @PathVariable UUID id) {
        Long userId = currentUserService.requireId(userDetails.getUsername());
        AnalysisResponse response = logAnalyzerService.getAnalysisById(userId, id);
        return ResponseEntity.ok(response);
    }
}
