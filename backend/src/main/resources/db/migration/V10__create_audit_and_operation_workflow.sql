CREATE TABLE operation_requests (
    id UUID PRIMARY KEY,
    requester_id BIGINT NOT NULL REFERENCES users(id),
    approver_id BIGINT REFERENCES users(id),
    recommendation TEXT NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL,
    correlation_id VARCHAR(100) NOT NULL,
    execution_key VARCHAR(100) UNIQUE,
    decision_reason VARCHAR(1000),
    result_summary VARCHAR(2000),
    approval_expires_at TIMESTAMP NOT NULL,
    decided_at TIMESTAMP,
    execution_started_at TIMESTAMP,
    completed_at TIMESTAMP,
    approval_turnaround_ms BIGINT,
    execution_latency_ms BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_operation_risk CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    CONSTRAINT chk_operation_status CHECK (status IN (
        'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXECUTING', 'SUCCEEDED', 'FAILED', 'EXPIRED'))
);

CREATE INDEX idx_operations_status_created ON operation_requests(status, created_at DESC);
CREATE INDEX idx_operations_requester_created ON operation_requests(requester_id, created_at DESC);
CREATE INDEX idx_operations_correlation ON operation_requests(correlation_id);

CREATE TABLE audit_events (
    id UUID PRIMARY KEY,
    actor_email VARCHAR(320),
    actor_role VARCHAR(20),
    action VARCHAR(80) NOT NULL,
    resource_type VARCHAR(80) NOT NULL,
    resource_id VARCHAR(120),
    correlation_id VARCHAR(100) NOT NULL,
    success BOOLEAN NOT NULL,
    metadata TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_events_created_at ON audit_events(created_at DESC);
CREATE INDEX idx_audit_events_actor_created ON audit_events(actor_email, created_at DESC);
CREATE INDEX idx_audit_events_action_created ON audit_events(action, created_at DESC);
CREATE INDEX idx_audit_events_correlation ON audit_events(correlation_id);

-- Defense in depth: even a future repository method cannot silently rewrite history.
CREATE FUNCTION prevent_audit_mutation() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'audit_events is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_events_no_update
    BEFORE UPDATE OR DELETE ON audit_events
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();
