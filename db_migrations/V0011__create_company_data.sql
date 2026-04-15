
CREATE TABLE t_p54886222_design_office_projec.company_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES t_p54886222_design_office_projec.users(id),
    entity_type VARCHAR(20) NOT NULL DEFAULT 'individual',
    data JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_company_data_user ON t_p54886222_design_office_projec.company_data(user_id);
