package com.forgeops.backend.operation.service;

import com.forgeops.backend.audit.service.AuditService;
import com.forgeops.backend.auth.entity.User;
import com.forgeops.backend.auth.entity.UserRole;
import com.forgeops.backend.auth.service.CurrentUserService;
import com.forgeops.backend.common.exception.BusinessRuleViolationException;
import com.forgeops.backend.common.exception.ResourceNotFoundException;
import com.forgeops.backend.common.web.CorrelationIdFilter;
import com.forgeops.backend.operation.dto.*;
import com.forgeops.backend.operation.entity.OperationRequest;
import com.forgeops.backend.operation.entity.OperationStatus;
import com.forgeops.backend.operation.entity.RiskLevel;
import com.forgeops.backend.operation.repository.OperationRequestRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class OperationService {
    private static final Pattern INLINE_SECRET = Pattern.compile(
            "(?i)(password|passwd|token|api[_-]?key|secret)(\\s*[=:]\\s*|\\s+)([^\\s;]+)");

    private final OperationRequestRepository repository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;
    private final MeterRegistry meterRegistry;
    private final Duration approvalTtl;

    public OperationService(OperationRequestRepository repository,
                            CurrentUserService currentUserService,
                            AuditService auditService,
                            MeterRegistry meterRegistry,
                            @Value("${forgeops.approval.ttl:24h}") Duration approvalTtl) {
        this.repository = repository;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
        this.meterRegistry = meterRegistry;
        this.approvalTtl = approvalTtl;
    }

    @Transactional
    public OperationResponse createRecommendation(String actorEmail, String recommendation, String safetyLevel) {
        User requester = currentUserService.requireByEmail(actorEmail);
        RiskLevel risk = toRisk(safetyLevel);
        OperationStatus initialStatus = risk == RiskLevel.LOW
                ? OperationStatus.APPROVED : OperationStatus.PENDING_APPROVAL;
        LocalDateTime now = LocalDateTime.now();
        OperationRequest operation = repository.save(new OperationRequest(
                requester,
                redactSecrets(recommendation),
                risk,
                initialStatus,
                CorrelationIdFilter.currentId(),
                now.plus(approvalTtl)));

        counter("forgeops.recommendations.created", "risk", risk.name()).increment();
        auditService.record(requester, "AI_RECOMMENDATION_CREATED", "OPERATION", operation.getId(), true,
                Map.of("risk", risk, "status", initialStatus,
                        "approvalRequired", risk != RiskLevel.LOW));
        if (risk == RiskLevel.LOW) {
            auditService.record(requester, "OPERATION_POLICY_APPROVED", "OPERATION", operation.getId(), true,
                    Map.of("policy", "LOW_RISK_EXTERNAL_HANDOFF"));
        }
        return toResponse(operation);
    }

    @Transactional(readOnly = true)
    public Page<OperationResponse> list(String actorEmail, OperationStatus status, int page, int size) {
        User actor = currentUserService.requireByEmail(actorEmail);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<OperationRequest> result;
        if (canReviewAll(actor)) {
            result = status == null ? repository.findAll(pageable) : repository.findAllByStatus(status, pageable);
        } else {
            result = repository.findAllByRequester(actor, pageable);
        }
        return result.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public OperationResponse get(String actorEmail, UUID id) {
        User actor = currentUserService.requireByEmail(actorEmail);
        OperationRequest operation = repository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Operation", "id", id));
        requireVisible(actor, operation);
        return toResponse(operation);
    }

    @Transactional(noRollbackFor = BusinessRuleViolationException.class)
    public OperationResponse decide(String actorEmail, UUID id, ApprovalDecisionRequest decision) {
        User approver = currentUserService.requireByEmail(actorEmail);
        OperationRequest operation = locked(id);
        if (operation.getStatus() != OperationStatus.PENDING_APPROVAL) {
            throw new BusinessRuleViolationException("Only pending operations can be approved or rejected.");
        }
        if (operation.getRequester().getId().equals(approver.getId())) {
            auditService.record(approver, "OPERATION_SELF_APPROVAL_BLOCKED", "OPERATION", id, false,
                    Map.of("risk", operation.getRiskLevel()));
            throw new AccessDeniedException("A requester cannot approve their own operation.");
        }
        if (isExpired(operation)) {
            expire(operation, approver);
            throw new BusinessRuleViolationException("The approval request is stale and has expired.");
        }

        operation.setApprover(approver);
        operation.setDecisionReason(normalizeReason(decision.reason()));
        operation.setDecidedAt(LocalDateTime.now());
        operation.setApprovalTurnaroundMs(Duration.between(operation.getCreatedAt(), operation.getDecidedAt()).toMillis());
        operation.setStatus(Boolean.TRUE.equals(decision.approved())
                ? OperationStatus.APPROVED : OperationStatus.REJECTED);
        repository.save(operation);
        String action = Boolean.TRUE.equals(decision.approved()) ? "OPERATION_APPROVED" : "OPERATION_REJECTED";
        counter("forgeops.approvals.decisions", "decision",
                Boolean.TRUE.equals(decision.approved()) ? "approved" : "rejected").increment();
        meterRegistry.timer("forgeops.approvals.turnaround", "decision",
                        Boolean.TRUE.equals(decision.approved()) ? "approved" : "rejected")
                .record(Duration.between(operation.getCreatedAt(), operation.getDecidedAt()));
        auditService.record(approver, action, "OPERATION", id, true,
                Map.of("requester", operation.getRequester().getEmail(), "risk", operation.getRiskLevel()));
        return toResponse(operation);
    }

    @Transactional(noRollbackFor = BusinessRuleViolationException.class)
    public ExecutionHandoffResponse startExecution(String actorEmail, UUID id, ExecutionStartRequest request) {
        User actor = currentUserService.requireByEmail(actorEmail);
        OperationRequest operation = locked(id);
        requireOwnerOrAdmin(actor, operation);

        if (operation.getStatus() == OperationStatus.EXECUTING
                && request.idempotencyKey().equals(operation.getExecutionKey())) {
            return handoff(operation);
        }
        if (operation.getStatus() != OperationStatus.APPROVED) {
            throw new BusinessRuleViolationException("The operation is not approved for execution handoff.");
        }
        if (isExpired(operation)) {
            expire(operation, actor);
            throw new BusinessRuleViolationException("The approval is stale and has expired.");
        }

        operation.setExecutionKey(request.idempotencyKey());
        operation.setExecutionStartedAt(LocalDateTime.now());
        operation.setStatus(OperationStatus.EXECUTING);
        repository.save(operation);
        counter("forgeops.operations.execution_started", "risk", operation.getRiskLevel().name()).increment();
        auditService.record(actor, "EXTERNAL_EXECUTION_STARTED", "OPERATION", id, true,
                Map.of("risk", operation.getRiskLevel(), "executionMode", "EXTERNAL_MANUAL"));
        return handoff(operation);
    }

    @Transactional
    public OperationResponse completeExecution(String actorEmail, UUID id, ExecutionResultRequest request) {
        User actor = currentUserService.requireByEmail(actorEmail);
        OperationRequest operation = locked(id);
        requireOwnerOrAdmin(actor, operation);

        OperationStatus desired = Boolean.TRUE.equals(request.succeeded())
                ? OperationStatus.SUCCEEDED : OperationStatus.FAILED;
        if ((operation.getStatus() == OperationStatus.SUCCEEDED || operation.getStatus() == OperationStatus.FAILED)
                && request.idempotencyKey().equals(operation.getExecutionKey())
                && operation.getStatus() == desired) {
            return toResponse(operation);
        }
        if (operation.getStatus() != OperationStatus.EXECUTING) {
            throw new BusinessRuleViolationException("Only an executing operation can accept a result.");
        }
        if (!request.idempotencyKey().equals(operation.getExecutionKey())) {
            auditService.record(actor, "EXECUTION_REPLAY_BLOCKED", "OPERATION", id, false, Map.of());
            throw new AccessDeniedException("The execution idempotency key does not match.");
        }

        operation.setStatus(desired);
        operation.setResultSummary(request.summary().trim());
        operation.setCompletedAt(LocalDateTime.now());
        operation.setExecutionLatencyMs(Duration.between(operation.getExecutionStartedAt(), operation.getCompletedAt()).toMillis());
        repository.save(operation);
        counter("forgeops.operations.completed", "outcome", desired.name().toLowerCase()).increment();
        meterRegistry.timer("forgeops.operations.execution_latency", "outcome", desired.name().toLowerCase())
                .record(Duration.between(operation.getExecutionStartedAt(), operation.getCompletedAt()));
        auditService.record(actor, "EXTERNAL_EXECUTION_COMPLETED", "OPERATION", id, true,
                Map.of("outcome", desired, "risk", operation.getRiskLevel()));
        return toResponse(operation);
    }

    private OperationRequest locked(UUID id) {
        return repository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Operation", "id", id));
    }

    private void expire(OperationRequest operation, User actor) {
        operation.setStatus(OperationStatus.EXPIRED);
        repository.save(operation);
        auditService.record(actor, "OPERATION_EXPIRED", "OPERATION", operation.getId(), false,
                Map.of("risk", operation.getRiskLevel()));
    }

    private boolean isExpired(OperationRequest operation) {
        return operation.getApprovalExpiresAt().isBefore(LocalDateTime.now());
    }

    private void requireVisible(User actor, OperationRequest operation) {
        if (!canReviewAll(actor) && !operation.getRequester().getId().equals(actor.getId())) {
            throw new AccessDeniedException("This operation is not visible to the current user.");
        }
    }

    private void requireOwnerOrAdmin(User actor, OperationRequest operation) {
        if (actor.getRole() != UserRole.ADMIN && !operation.getRequester().getId().equals(actor.getId())) {
            throw new AccessDeniedException("Only the requester or an administrator can execute this operation.");
        }
    }

    private boolean canReviewAll(User actor) {
        return actor.getRole() == UserRole.ADMIN || actor.getRole() == UserRole.APPROVER;
    }

    private RiskLevel toRisk(String safetyLevel) {
        if ("DANGEROUS".equalsIgnoreCase(safetyLevel)) return RiskLevel.HIGH;
        if ("CAUTION".equalsIgnoreCase(safetyLevel)) return RiskLevel.MEDIUM;
        return RiskLevel.LOW;
    }

    private String redactSecrets(String recommendation) {
        if (recommendation == null) return "";
        return INLINE_SECRET.matcher(recommendation).replaceAll("$1$2[REDACTED]");
    }

    private String normalizeReason(String reason) {
        return reason == null || reason.isBlank() ? null : reason.trim();
    }

    private Counter counter(String name, String tag, String value) {
        return meterRegistry.counter(name, tag, value);
    }

    private ExecutionHandoffResponse handoff(OperationRequest operation) {
        return new ExecutionHandoffResponse(operation.getId(), operation.getRecommendation(),
                operation.getExecutionKey(), operation.getCorrelationId(),
                "ForgeOps does not execute shell text. Run this recommendation in the approved target environment, " +
                        "then report the real outcome using the same idempotency key.");
    }

    private OperationResponse toResponse(OperationRequest operation) {
        return new OperationResponse(
                operation.getId(),
                operation.getRequester().getEmail(),
                operation.getApprover() == null ? null : operation.getApprover().getEmail(),
                operation.getRecommendation(),
                operation.getRiskLevel(),
                operation.getStatus(),
                operation.getCorrelationId(),
                operation.getDecisionReason(),
                operation.getResultSummary(),
                operation.getApprovalExpiresAt(),
                operation.getDecidedAt(),
                operation.getExecutionStartedAt(),
                operation.getCompletedAt(),
                operation.getCreatedAt(),
                operation.getUpdatedAt());
    }
}
