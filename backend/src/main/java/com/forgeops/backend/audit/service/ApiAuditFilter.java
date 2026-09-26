package com.forgeops.backend.audit.service;

import com.forgeops.backend.auth.entity.User;
import com.forgeops.backend.auth.service.CurrentUserService;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerMapping;

import java.io.IOException;
import java.util.Map;

@Component
public class ApiAuditFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(ApiAuditFilter.class);
    private final AuditService auditService;
    private final CurrentUserService currentUserService;
    private final MeterRegistry meterRegistry;

    public ApiAuditFilter(AuditService auditService, CurrentUserService currentUserService,
                          MeterRegistry meterRegistry) {
        this.auditService = auditService;
        this.currentUserService = currentUserService;
        this.meterRegistry = meterRegistry;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        Timer.Sample sample = Timer.start(meterRegistry);
        try {
            filterChain.doFilter(request, response);
        } finally {
            String route = routeTemplate(request);
            sample.stop(meterRegistry.timer("forgeops.api.latency", "method", request.getMethod(),
                    "route", route, "status", Integer.toString(response.getStatus())));
            meterRegistry.counter("forgeops.api.requests", "method", request.getMethod(),
                    "route", route, "outcome", response.getStatus() >= 500 ? "server_error"
                            : response.getStatus() >= 400 ? "client_error" : "success").increment();
            if (isAuditableMutation(request)) auditMutation(request, response, route);
        }
    }

    private void auditMutation(HttpServletRequest request, HttpServletResponse response, String route) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User actor = auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())
                    ? currentUserService.requireByEmail(auth.getName()) : null;
            auditService.record(actor, "API_" + request.getMethod(), "API_ROUTE", route,
                    response.getStatus() < 400,
                    Map.of("status", response.getStatus(), "contentType",
                            response.getContentType() == null ? "unknown" : response.getContentType()));
        } catch (Exception exception) {
            // An audit storage outage is observable, but must not alter the already-completed API result.
            meterRegistry.counter("forgeops.audit.write_errors").increment();
            log.error("Audit event persistence failed for {} {}", request.getMethod(), route, exception);
        }
    }

    private boolean isAuditableMutation(HttpServletRequest request) {
        String method = request.getMethod();
        String path = request.getRequestURI();
        return ("POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method) || "DELETE".equals(method))
                && path.startsWith("/api/") && !path.startsWith("/api/audit");
    }

    private String routeTemplate(HttpServletRequest request) {
        Object pattern = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        if (pattern != null) return pattern.toString();
        String path = request.getRequestURI();
        return path.startsWith("/api/") ? "/api/unmatched" : "other";
    }
}
