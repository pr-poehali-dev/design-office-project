
ALTER TABLE t_p54886222_design_office_projec.messages ALTER COLUMN project_id SET DEFAULT NULL;
ALTER TABLE t_p54886222_design_office_projec.messages ALTER COLUMN project_id TYPE UUID USING project_id::UUID;
