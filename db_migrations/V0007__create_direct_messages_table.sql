
CREATE TABLE t_p54886222_design_office_projec.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES t_p54886222_design_office_projec.users(id),
    receiver_id UUID NOT NULL REFERENCES t_p54886222_design_office_projec.users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dm_sender ON t_p54886222_design_office_projec.direct_messages(sender_id);
CREATE INDEX idx_dm_receiver ON t_p54886222_design_office_projec.direct_messages(receiver_id);
CREATE INDEX idx_dm_created ON t_p54886222_design_office_projec.direct_messages(created_at);
