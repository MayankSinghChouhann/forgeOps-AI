package com.forgeops.backend.auth.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;

class MetricsAuthenticationFilterTest {

    private final MetricsAuthenticationFilter filter =
            new MetricsAuthenticationFilter("forgeops-monitor", "metrics-secret");

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authenticatesValidMonitoringCredentialsForPrometheus() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/actuator/prometheus");
        String credentials = Base64.getEncoder().encodeToString(
                "forgeops-monitor:metrics-secret".getBytes(StandardCharsets.UTF_8));
        request.addHeader("Authorization", "Basic " + credentials);

        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getAuthorities())
                .extracting("authority")
                .containsExactly("ROLE_ADMIN");
    }

    @Test
    void rejectsInvalidMonitoringCredentials() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/actuator/prometheus");
        String credentials = Base64.getEncoder().encodeToString(
                "forgeops-monitor:wrong".getBytes(StandardCharsets.UTF_8));
        request.addHeader("Authorization", "Basic " + credentials);

        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void ignoresMonitoringCredentialsOnApplicationRoutes() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/dashboard/metrics");
        String credentials = Base64.getEncoder().encodeToString(
                "forgeops-monitor:metrics-secret".getBytes(StandardCharsets.UTF_8));
        request.addHeader("Authorization", "Basic " + credentials);

        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }
}
