
CREATE TYPE t_p54886222_design_office_projec.proposal_status AS ENUM ('draft', 'sent', 'accepted', 'declined');

CREATE TABLE t_p54886222_design_office_projec.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES t_p54886222_design_office_projec.projects(id),
    status t_p54886222_design_office_projec.proposal_status NOT NULL DEFAULT 'draft',
    background_url TEXT,
    background_preset VARCHAR(50),
    template_name VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE t_p54886222_design_office_projec.proposal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES t_p54886222_design_office_projec.proposals(id),
    order_number INTEGER NOT NULL DEFAULT 0,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT now()
);
