package com.forgeops.backend.evaluation.controller;

import com.forgeops.backend.evaluation.dto.EvaluationMetricsResponse;
import com.forgeops.backend.evaluation.service.EvaluationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/evaluation")
public class EvaluationController {
    private final EvaluationService evaluationService;

    public EvaluationController(EvaluationService evaluationService) {
        this.evaluationService = evaluationService;
    }

    @GetMapping("/metrics")
    @PreAuthorize("hasAuthority('EVALUATION_READ')")
    public EvaluationMetricsResponse metrics() {
        return evaluationService.current();
    }
}
