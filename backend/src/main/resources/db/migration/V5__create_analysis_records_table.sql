CREATE TABLE analysis_records (
    id UUID PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL,
    title VARCHAR(200),
    raw_log TEXT NOT NULL,
    error_summary TEXT,
    root_cause TEXT,
    failure_stage VARCHAR(100),
    severity VARCHAR(50),
    remediation_script TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_analysis_records_user_created_at
    ON analysis_records(user_id, created_at DESC);
CREATE INDEX idx_analysis_records_target_created_at
    ON analysis_records(target_type, created_at DESC);
