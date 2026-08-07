package com.forgeops.backend.dashboard.controller;

import com.forgeops.backend.dashboard.dto.DashboardMetricsResponse;
import com.forgeops.backend.dashboard.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/metrics")
    public ResponseEntity<DashboardMetricsResponse> getMetrics() {
        DashboardMetricsResponse metrics = dashboardService.getLiveMetrics();
        return ResponseEntity.ok(metrics);
    }
}
