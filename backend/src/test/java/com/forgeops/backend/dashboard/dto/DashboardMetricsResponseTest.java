package com.forgeops.backend.dashboard.dto;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class DashboardMetricsResponseTest {

    private final ObjectMapper objectMapper = JsonMapper.builder().findAndAddModules().build();

    @Test
    void redisCachePayload_RoundTripsThroughJson() throws Exception {
        DashboardMetricsResponse source = new DashboardMetricsResponse(
                new DashboardMetricsResponse.MemoryStats(10, 20, 40, 25),
                new DashboardMetricsResponse.CpuStats(8, 0.5, 6),
                new DashboardMetricsResponse.DatabaseStats(1, 4, 5, "HikariPool-1"),
                new DashboardMetricsResponse.PlatformCounters(2, 3, 4, 5),
                List.of(new DashboardMetricsResponse.ActivityEvent(
                        "ANALYZER", "Incident", "RCA complete", "SUCCESS", LocalDateTime.now())),
                "HEALTHY",
                42,
                List.of(new DashboardMetricsResponse.ServiceHealth(
                        "forgeops-redis", "Redis cache", "ONLINE", "Dashboard cache"))
        );

        String json = objectMapper.writeValueAsString(source);
        DashboardMetricsResponse restored = objectMapper.readValue(json, DashboardMetricsResponse.class);

        assertThat(restored.getSystemStatus()).isEqualTo("HEALTHY");
        assertThat(restored.getMemory().getUsedMB()).isEqualTo(10);
        assertThat(restored.getRecentActivities()).hasSize(1);
        assertThat(restored.getServices()).singleElement()
                .extracting(DashboardMetricsResponse.ServiceHealth::getStatus)
                .isEqualTo("ONLINE");
    }
}
