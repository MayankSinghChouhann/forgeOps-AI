package com.forgeops.backend.dashboard.controller;

import com.forgeops.backend.dashboard.dto.DashboardMetricsResponse;
import com.forgeops.backend.dashboard.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
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
    @PreAuthorize("hasAuthority('DASHBOARD_READ')")
    public ResponseEntity<DashboardMetricsResponse> getMetrics(@AuthenticationPrincipal UserDetails user) {
        DashboardMetricsResponse metrics = dashboardService.getLiveMetrics(user.getUsername());
        return ResponseEntity.ok(metrics);
    }
}
