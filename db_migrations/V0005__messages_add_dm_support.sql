
ALTER TABLE t_p54886222_design_office_projec.messages
ADD COLUMN receiver_id UUID REFERENCES t_p54886222_design_office_projec.users(id),
ADD COLUMN is_read BOOLEAN DEFAULT false;

CREATE INDEX idx_messages_receiver_id ON t_p54886222_design_office_projec.messages(receiver_id);
CREATE INDEX idx_messages_is_read ON t_p54886222_design_office_projec.messages(is_read);
