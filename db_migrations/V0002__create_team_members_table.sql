
CREATE TYPE t_p54886222_design_office_projec.team_role AS ENUM ('designer', 'visualizer', 'draftsman', 'procurement', 'foreman');

CREATE TABLE t_p54886222_design_office_projec.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES t_p54886222_design_office_projec.users(id),
    member_id UUID NOT NULL REFERENCES t_p54886222_design_office_projec.users(id),
    team_role t_p54886222_design_office_projec.team_role NOT NULL DEFAULT 'designer',
    invited_at TIMESTAMP DEFAULT now(),
    accepted BOOLEAN DEFAULT false,
    UNIQUE(owner_id, member_id)
);
