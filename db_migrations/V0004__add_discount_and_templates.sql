
ALTER TABLE t_p54886222_design_office_projec.proposals
ADD COLUMN discount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN discount_type VARCHAR(10) DEFAULT 'fixed';

CREATE TABLE t_p54886222_design_office_projec.proposal_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES t_p54886222_design_office_projec.users(id),
    name VARCHAR(200) NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP DEFAULT now()
);
