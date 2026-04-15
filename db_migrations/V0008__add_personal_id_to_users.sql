
ALTER TABLE t_p54886222_design_office_projec.users
ADD COLUMN personal_id VARCHAR(8) UNIQUE;

UPDATE t_p54886222_design_office_projec.users
SET personal_id = UPPER(SUBSTR(MD5(id::text || created_at::text), 1, 8))
WHERE personal_id IS NULL;

ALTER TABLE t_p54886222_design_office_projec.users
ALTER COLUMN personal_id SET DEFAULT UPPER(SUBSTR(MD5(gen_random_uuid()::text), 1, 8));

CREATE UNIQUE INDEX idx_users_personal_id ON t_p54886222_design_office_projec.users(personal_id);
