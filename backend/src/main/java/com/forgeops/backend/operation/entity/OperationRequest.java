package com.forgeops.backend.operation.entity;

import com.forgeops.backend.auth.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "operation_requests", indexes = {
        @Index(name = "idx_operations_status_created", columnList = "status,created_at"),
        @Index(name = "idx_operations_requester_created", columnList = "requester_id,created_at"),
        @Index(name = "idx_operations_correlation", columnList = "correlation_id")
}, uniqueConstraints = @UniqueConstraint(name = "uk_operations_execution_key", columnNames = "execution_key"))
public class OperationRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id")
    private User approver;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String recommendation;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false, length = 20)
    private RiskLevel riskLevel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OperationStatus status;

    @Column(name = "correlation_id", nullable = false, length = 100)
    private String correlationId;

    @Column(name = "execution_key", length = 100)
    private String executionKey;

    @Column(name = "decision_reason", length = 1_000)
    private String decisionReason;

    @Column(name = "result_summary", length = 2_000)
    private String resultSummary;

    @Column(name = "approval_expires_at", nullable = false)
    private LocalDateTime approvalExpiresAt;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @Column(name = "execution_started_at")
    private LocalDateTime executionStartedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "approval_turnaround_ms")
    private Long approvalTurnaroundMs;

    @Column(name = "execution_latency_ms")
    private Long executionLatencyMs;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Version
    private long version;

    protected OperationRequest() {}

    public OperationRequest(User requester, String recommendation, RiskLevel riskLevel,
                            OperationStatus status, String correlationId, LocalDateTime approvalExpiresAt) {
        this.requester = requester;
        this.recommendation = recommendation;
        this.riskLevel = riskLevel;
        this.status = status;
        this.correlationId = correlationId;
        this.approvalExpiresAt = approvalExpiresAt;
    }

    public UUID getId() { return id; }
    public User getRequester() { return requester; }
    public User getApprover() { return approver; }
    public void setApprover(User approver) { this.approver = approver; }
    public String getRecommendation() { return recommendation; }
    public RiskLevel getRiskLevel() { return riskLevel; }
    public OperationStatus getStatus() { return status; }
    public void setStatus(OperationStatus status) { this.status = status; }
    public String getCorrelationId() { return correlationId; }
    public String getExecutionKey() { return executionKey; }
    public void setExecutionKey(String executionKey) { this.executionKey = executionKey; }
    public String getDecisionReason() { return decisionReason; }
    public void setDecisionReason(String decisionReason) { this.decisionReason = decisionReason; }
    public String getResultSummary() { return resultSummary; }
    public void setResultSummary(String resultSummary) { this.resultSummary = resultSummary; }
    public LocalDateTime getApprovalExpiresAt() { return approvalExpiresAt; }
    public LocalDateTime getDecidedAt() { return decidedAt; }
    public void setDecidedAt(LocalDateTime decidedAt) { this.decidedAt = decidedAt; }
    public LocalDateTime getExecutionStartedAt() { return executionStartedAt; }
    public void setExecutionStartedAt(LocalDateTime executionStartedAt) { this.executionStartedAt = executionStartedAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    public Long getApprovalTurnaroundMs() { return approvalTurnaroundMs; }
    public void setApprovalTurnaroundMs(Long approvalTurnaroundMs) { this.approvalTurnaroundMs = approvalTurnaroundMs; }
    public Long getExecutionLatencyMs() { return executionLatencyMs; }
    public void setExecutionLatencyMs(Long executionLatencyMs) { this.executionLatencyMs = executionLatencyMs; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public long getVersion() { return version; }
}
