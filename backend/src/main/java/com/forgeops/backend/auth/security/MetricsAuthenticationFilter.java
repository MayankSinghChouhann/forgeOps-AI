package com.forgeops.backend.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.List;

@Component
public class MetricsAuthenticationFilter extends OncePerRequestFilter {

    private final String username;
    private final String password;

    public MetricsAuthenticationFilter(
            @Value("${forgeops.metrics.username:forgeops-monitor}") String username,
            @Value("${forgeops.metrics.password:}") String password) {
        this.username = username;
        this.password = password;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !"/actuator/prometheus".equals(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (!password.isBlank() && credentialsMatch(request.getHeader("Authorization"))) {
            var authentication = new UsernamePasswordAuthenticationToken(
                    username,
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
        chain.doFilter(request, response);
    }

    private boolean credentialsMatch(String authorization) {
        if (authorization == null || !authorization.startsWith("Basic ")) return false;
        try {
            String decoded = new String(
                    Base64.getDecoder().decode(authorization.substring(6)), StandardCharsets.UTF_8);
            int separator = decoded.indexOf(':');
            if (separator < 0) return false;
            return constantTimeEquals(username, decoded.substring(0, separator))
                    && constantTimeEquals(password, decoded.substring(separator + 1));
        } catch (IllegalArgumentException ignored) {
            return false;
        }
    }

    private boolean constantTimeEquals(String expected, String actual) {
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8));
    }
}
