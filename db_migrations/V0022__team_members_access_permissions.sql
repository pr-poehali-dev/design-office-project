
-- Add access_permissions JSONB column to team_members
-- Default: all sections visible EXCEPT proposal, finance, documents
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS access_permissions JSONB NOT NULL DEFAULT '{"overview":true,"execution":true,"brief":true,"estimate":false,"finance":false,"documents":false,"proposal":false}'::jsonb;

-- Add allowed_project_ids: list of project UUIDs the member can access (null = no projects yet)
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS allowed_project_ids UUID[] DEFAULT '{}';
