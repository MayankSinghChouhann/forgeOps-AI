package com.forgeops.backend.analyzer.controller;

import com.forgeops.backend.analyzer.dto.AnalysisResponse;
import com.forgeops.backend.analyzer.dto.AnalyzeLogRequest;
import com.forgeops.backend.analyzer.service.LogAnalyzerService;
import com.forgeops.backend.auth.entity.User;
import com.forgeops.backend.auth.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/analyzer")
public class AnalyzerController {

    private final LogAnalyzerService logAnalyzerService;
    private final UserRepository userRepository;

    public AnalyzerController(LogAnalyzerService logAnalyzerService, UserRepository userRepository) {
        this.logAnalyzerService = logAnalyzerService;
        this.userRepository = userRepository;
    }

    @PostMapping("/analyze")
    public ResponseEntity<AnalysisResponse> analyzeLog(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AnalyzeLogRequest request) {
        Long userId = resolveUserId(userDetails);
        AnalysisResponse response = logAnalyzerService.analyzeLog(userId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<AnalysisResponse>> getHistory(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        List<AnalysisResponse> history = logAnalyzerService.getUserHistory(userId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnalysisResponse> getAnalysisById(@PathVariable UUID id) {
        AnalysisResponse response = logAnalyzerService.getAnalysisById(id);
        return ResponseEntity.ok(response);
    }

    private Long resolveUserId(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElse(null);
    }
}
