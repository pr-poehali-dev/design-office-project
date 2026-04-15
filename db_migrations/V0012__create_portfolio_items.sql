
CREATE TABLE t_p54886222_design_office_projec.portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES t_p54886222_design_office_projec.users(id),
    title VARCHAR(200) NOT NULL DEFAULT '',
    image_url TEXT NOT NULL,
    order_number INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_portfolio_user ON t_p54886222_design_office_projec.portfolio_items(user_id);
