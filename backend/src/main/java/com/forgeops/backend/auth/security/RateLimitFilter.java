package com.forgeops.backend.auth.security;

import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;
    private final int authRequestsPerMinute;
    private final int aiRequestsPerMinute;

    public RateLimitFilter(ObjectMapper objectMapper,
                           @Value("${forgeops.security.rate-limit.auth-per-minute:20}") int authRequestsPerMinute,
                           @Value("${forgeops.security.rate-limit.ai-per-minute:60}") int aiRequestsPerMinute) {
        this.objectMapper = objectMapper;
        this.authRequestsPerMinute = authRequestsPerMinute;
        this.aiRequestsPerMinute = aiRequestsPerMinute;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String group = routeGroup(request);
        if (group == null) {
            chain.doFilter(request, response);
            return;
        }

        int limit = "auth".equals(group) ? authRequestsPerMinute : aiRequestsPerMinute;
        String key = request.getRemoteAddr() + ':' + group;
        long minute = Instant.now().getEpochSecond() / 60;
        Window window = windows.compute(key, (ignored, current) ->
                current == null || current.minute() != minute
                        ? new Window(minute, new AtomicInteger(1))
                        : increment(current));

        if (windows.size() > 10_000) {
            windows.entrySet().removeIf(entry -> entry.getValue().minute() < minute - 1);
        }

        if (window.count().get() > limit) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            response.setHeader("Retry-After", "60");
            ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                    HttpStatus.TOO_MANY_REQUESTS, "Request rate limit exceeded. Retry in one minute.");
            problem.setTitle("Too Many Requests");
            problem.setProperty("timestamp", Instant.now().toString());
            objectMapper.writeValue(response.getOutputStream(), problem);
            return;
        }
        chain.doFilter(request, response);
    }

    private Window increment(Window current) {
        current.count().incrementAndGet();
        return current;
    }

    private String routeGroup(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) return null;
        String path = request.getRequestURI();
        if (path.startsWith("/api/auth/")) return "auth";
        if (path.startsWith("/api/assistant/chat") || path.equals("/api/analyzer/analyze")
                || path.equals("/api/generator/generate") || path.startsWith("/api/terminal/")) return "ai";
        return null;
    }

    private record Window(long minute, AtomicInteger count) {}
}
