CREATE TABLE generated_templates (
    id UUID PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    template_type VARCHAR(50) NOT NULL,
    target_provider VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    code_content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_generated_templates_user_created_at
    ON generated_templates(user_id, created_at DESC);
CREATE INDEX idx_generated_templates_type_created_at
    ON generated_templates(template_type, created_at DESC);
