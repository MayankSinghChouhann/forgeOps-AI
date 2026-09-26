package com.forgeops.backend.audit.entity;

import com.forgeops.backend.auth.entity.UserRole;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_events", indexes = {
        @Index(name = "idx_audit_events_created_at", columnList = "created_at"),
        @Index(name = "idx_audit_events_actor_created", columnList = "actor_email,created_at"),
        @Index(name = "idx_audit_events_action_created", columnList = "action,created_at"),
        @Index(name = "idx_audit_events_correlation", columnList = "correlation_id")
})
public class AuditEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "actor_email", length = 320)
    private String actorEmail;

    @Enumerated(EnumType.STRING)
    @Column(name = "actor_role", length = 20)
    private UserRole actorRole;

    @Column(nullable = false, length = 80)
    private String action;

    @Column(name = "resource_type", nullable = false, length = 80)
    private String resourceType;

    @Column(name = "resource_id", length = 120)
    private String resourceId;

    @Column(name = "correlation_id", nullable = false, length = 100)
    private String correlationId;

    @Column(nullable = false)
    private boolean success;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected AuditEvent() {}

    public AuditEvent(String actorEmail, UserRole actorRole, String action, String resourceType,
                      String resourceId, String correlationId, boolean success, String metadata) {
        this.actorEmail = actorEmail;
        this.actorRole = actorRole;
        this.action = action;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.correlationId = correlationId;
        this.success = success;
        this.metadata = metadata;
    }

    public UUID getId() { return id; }
    public String getActorEmail() { return actorEmail; }
    public UserRole getActorRole() { return actorRole; }
    public String getAction() { return action; }
    public String getResourceType() { return resourceType; }
    public String getResourceId() { return resourceId; }
    public String getCorrelationId() { return correlationId; }
    public boolean isSuccess() { return success; }
    public String getMetadata() { return metadata; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
