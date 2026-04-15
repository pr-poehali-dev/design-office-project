
ALTER TABLE t_p54886222_design_office_projec.users
ADD COLUMN IF NOT EXISTS accepting_orders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS contacts_public BOOLEAN DEFAULT true;
