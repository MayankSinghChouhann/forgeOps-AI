package com.forgeops.backend.evaluation.dto;

public record EvaluationMetricsResponse(
        long totalRecommendations,
        long pendingApproval,
        long approved,
        long rejected,
        long executing,
        long succeeded,
        long failed,
        long expired,
        Double recommendationAcceptanceRate,
        Double executionSuccessRate,
        Double averageApprovalTurnaroundMs,
        Double averageExecutionLatencyMs
) {}
