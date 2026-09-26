package com.forgeops.backend.audit.service;

import com.forgeops.backend.audit.entity.AuditEvent;
import com.forgeops.backend.audit.repository.AuditEventRepository;
import com.forgeops.backend.auth.entity.User;
import com.forgeops.backend.common.web.CorrelationIdFilter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class AuditService {
    private static final Set<String> SENSITIVE_TERMS = Set.of(
            "password", "secret", "token", "authorization", "cookie", "api_key", "apikey", "credential");
    private static final int MAX_VALUE_LENGTH = 2_000;

    private final AuditEventRepository repository;
    private final ObjectMapper objectMapper;

    public AuditService(AuditEventRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(User actor, String action, String resourceType, Object resourceId,
                       boolean success, Map<String, ?> metadata) {
        Map<String, Object> safeMetadata = sanitize(metadata == null ? Map.of() : metadata);
        String json;
        try {
            json = objectMapper.writeValueAsString(safeMetadata);
        } catch (Exception ignored) {
            json = "{\"serialization\":\"unavailable\"}";
        }
        repository.save(new AuditEvent(
                actor == null ? null : actor.getEmail(),
                actor == null ? null : actor.getRole(),
                action,
                resourceType,
                resourceId == null ? null : resourceId.toString(),
                CorrelationIdFilter.currentId(),
                success,
                json));
    }

    private Map<String, Object> sanitize(Map<String, ?> metadata) {
        Map<String, Object> clean = new LinkedHashMap<>();
        metadata.forEach((key, value) -> {
            String normalized = key.toLowerCase(Locale.ROOT).replace('-', '_');
            boolean sensitive = SENSITIVE_TERMS.stream().anyMatch(normalized::contains);
            clean.put(key, sensitive ? "[REDACTED]" : safeValue(value));
        });
        return clean;
    }

    private Object safeValue(Object value) {
        if (value == null || value instanceof Number || value instanceof Boolean) return value;
        if (value instanceof Enum<?> enumeration) return enumeration.name();
        String text = value.toString();
        return text.length() <= MAX_VALUE_LENGTH ? text : text.substring(0, MAX_VALUE_LENGTH) + "…";
    }
}
