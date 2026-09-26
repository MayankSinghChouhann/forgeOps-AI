package com.forgeops.backend.audit.controller;

import com.forgeops.backend.audit.dto.AuditEventResponse;
import com.forgeops.backend.audit.entity.AuditEvent;
import com.forgeops.backend.audit.repository.AuditEventRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/audit")
@Validated
public class AuditController {
    private final AuditEventRepository repository;

    public AuditController(AuditEventRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('AUDIT_READ')")
    public Page<AuditEventResponse> search(
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String correlationId,
            @RequestParam(required = false) Boolean success,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "50") @Min(1) @Max(200) int size) {
        return repository.findAll((root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (actor != null && !actor.isBlank()) predicates.add(builder.equal(root.get("actorEmail"), actor));
            if (action != null && !action.isBlank()) predicates.add(builder.equal(root.get("action"), action));
            if (resourceType != null && !resourceType.isBlank()) predicates.add(builder.equal(root.get("resourceType"), resourceType));
            if (correlationId != null && !correlationId.isBlank()) predicates.add(builder.equal(root.get("correlationId"), correlationId));
            if (success != null) predicates.add(builder.equal(root.get("success"), success));
            if (from != null) predicates.add(builder.greaterThanOrEqualTo(root.get("createdAt"), from));
            if (to != null) predicates.add(builder.lessThanOrEqualTo(root.get("createdAt"), to));
            return builder.and(predicates.toArray(Predicate[]::new));
        }, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))).map(this::toResponse);
    }

    private AuditEventResponse toResponse(AuditEvent event) {
        return new AuditEventResponse(event.getId(), event.getActorEmail(), event.getActorRole(), event.getAction(),
                event.getResourceType(), event.getResourceId(), event.getCorrelationId(), event.isSuccess(),
                event.getMetadata(), event.getCreatedAt());
    }
}
