package com.forgeops.backend.operation.service;

import com.forgeops.backend.audit.service.AuditService;
import com.forgeops.backend.auth.entity.User;
import com.forgeops.backend.auth.entity.UserRole;
import com.forgeops.backend.auth.service.CurrentUserService;
import com.forgeops.backend.common.exception.BusinessRuleViolationException;
import com.forgeops.backend.operation.dto.ApprovalDecisionRequest;
import com.forgeops.backend.operation.dto.ExecutionResultRequest;
import com.forgeops.backend.operation.dto.ExecutionStartRequest;
import com.forgeops.backend.operation.entity.OperationRequest;
import com.forgeops.backend.operation.entity.OperationStatus;
import com.forgeops.backend.operation.entity.RiskLevel;
import com.forgeops.backend.operation.repository.OperationRequestRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OperationServiceTest {
    @Mock OperationRequestRepository repository;
    @Mock CurrentUserService currentUserService;
    @Mock AuditService auditService;

    private OperationService service;
    private User requester;
    private User approver;

    @BeforeEach
    void setUp() {
        service = new OperationService(repository, currentUserService, auditService,
                new SimpleMeterRegistry(), Duration.ofHours(24));
        requester = user(1L, "operator@forgeops.ai", UserRole.OPERATOR);
        approver = user(2L, "approver@forgeops.ai", UserRole.APPROVER);
    }

    @Test
    void highRiskRecommendationAlwaysStartsPendingApprovalAndRedactsSecrets() {
        when(currentUserService.requireByEmail(requester.getEmail())).thenReturn(requester);
        when(repository.save(any(OperationRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.createRecommendation(requester.getEmail(),
                "kubectl delete secret x --token=raw-secret", "DANGEROUS");

        assertThat(response.status()).isEqualTo(OperationStatus.PENDING_APPROVAL);
        assertThat(response.riskLevel()).isEqualTo(RiskLevel.HIGH);
        assertThat(response.recommendation()).contains("[REDACTED]").doesNotContain("raw-secret");
    }

    @Test
    void selfApprovalIsBlockedEvenForAuthorizedRole() {
        requester.setRole(UserRole.APPROVER);
        OperationRequest operation = pending(requester, LocalDateTime.now().plusHours(1));
        when(currentUserService.requireByEmail(requester.getEmail())).thenReturn(requester);
        when(repository.findByIdForUpdate(operation.getId())).thenReturn(Optional.of(operation));

        assertThatThrownBy(() -> service.decide(requester.getEmail(), operation.getId(),
                new ApprovalDecisionRequest(true, "looks good")))
                .isInstanceOf(AccessDeniedException.class);
        assertThat(operation.getStatus()).isEqualTo(OperationStatus.PENDING_APPROVAL);
    }

    @Test
    void staleApprovalIsExpiredInsteadOfBeingAccepted() {
        OperationRequest operation = pending(requester, LocalDateTime.now().minusMinutes(1));
        when(currentUserService.requireByEmail(approver.getEmail())).thenReturn(approver);
        when(repository.findByIdForUpdate(operation.getId())).thenReturn(Optional.of(operation));

        assertThatThrownBy(() -> service.decide(approver.getEmail(), operation.getId(),
                new ApprovalDecisionRequest(true, null)))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("expired");
        assertThat(operation.getStatus()).isEqualTo(OperationStatus.EXPIRED);
    }

    @Test
    void executionStartIsIdempotentAndRejectsASecondKey() {
        OperationRequest operation = pending(requester, LocalDateTime.now().plusHours(1));
        operation.setStatus(OperationStatus.APPROVED);
        when(currentUserService.requireByEmail(requester.getEmail())).thenReturn(requester);
        when(repository.findByIdForUpdate(operation.getId())).thenReturn(Optional.of(operation));
        String key = "execution-key-0001";

        var first = service.startExecution(requester.getEmail(), operation.getId(), new ExecutionStartRequest(key));
        var retry = service.startExecution(requester.getEmail(), operation.getId(), new ExecutionStartRequest(key));

        assertThat(first.idempotencyKey()).isEqualTo(key);
        assertThat(retry.idempotencyKey()).isEqualTo(key);
        assertThat(operation.getStatus()).isEqualTo(OperationStatus.EXECUTING);
        assertThatThrownBy(() -> service.startExecution(requester.getEmail(), operation.getId(),
                new ExecutionStartRequest("execution-key-0002")))
                .isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void resultReplayWithWrongKeyIsBlocked() {
        OperationRequest operation = pending(requester, LocalDateTime.now().plusHours(1));
        operation.setStatus(OperationStatus.EXECUTING);
        operation.setExecutionKey("execution-key-0001");
        operation.setExecutionStartedAt(LocalDateTime.now());
        when(currentUserService.requireByEmail(requester.getEmail())).thenReturn(requester);
        when(repository.findByIdForUpdate(operation.getId())).thenReturn(Optional.of(operation));

        assertThatThrownBy(() -> service.completeExecution(requester.getEmail(), operation.getId(),
                new ExecutionResultRequest("execution-key-0002", true, "completed")))
                .isInstanceOf(AccessDeniedException.class);
        assertThat(operation.getStatus()).isEqualTo(OperationStatus.EXECUTING);
    }

    @Test
    void recommendationApprovalHandoffAndReportedSuccessCompleteTheLifecycle() {
        OperationRequest operation = pending(requester, LocalDateTime.now().plusHours(1));
        when(currentUserService.requireByEmail(approver.getEmail())).thenReturn(approver);
        when(currentUserService.requireByEmail(requester.getEmail())).thenReturn(requester);
        when(repository.findByIdForUpdate(operation.getId())).thenReturn(Optional.of(operation));

        var approved = service.decide(approver.getEmail(), operation.getId(),
                new ApprovalDecisionRequest(true, "reviewed targets"));
        assertThat(approved.status()).isEqualTo(OperationStatus.APPROVED);
        assertThat(approved.approver()).isEqualTo(approver.getEmail());

        String key = "execution-key-0001";
        service.startExecution(requester.getEmail(), operation.getId(), new ExecutionStartRequest(key));
        var completed = service.completeExecution(requester.getEmail(), operation.getId(),
                new ExecutionResultRequest(key, true, "rollout verified healthy"));

        assertThat(completed.status()).isEqualTo(OperationStatus.SUCCEEDED);
        assertThat(completed.resultSummary()).isEqualTo("rollout verified healthy");
        assertThat(completed.completedAt()).isNotNull();
    }

    private OperationRequest pending(User owner, LocalDateTime expiry) {
        OperationRequest operation = new OperationRequest(owner, "kubectl delete pod api", RiskLevel.HIGH,
                OperationStatus.PENDING_APPROVAL, UUID.randomUUID().toString(), expiry);
        ReflectionTestUtils.setField(operation, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(operation, "createdAt", LocalDateTime.now().minusMinutes(2));
        return operation;
    }

    private User user(long id, String email, UserRole role) {
        User user = new User(email, "hash");
        user.setId(id);
        user.setRole(role);
        return user;
    }
}
