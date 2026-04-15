
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    partner_type VARCHAR(50) NOT NULL CHECK (partner_type IN ('shop', 'supplier', 'finisher', 'other')),
    discount NUMERIC(4,1) NOT NULL DEFAULT 0 CHECK (discount >= 0 AND discount <= 100),
    services TEXT,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    website VARCHAR(500),
    address TEXT,
    contact_person VARCHAR(255),
    note TEXT,
    logo_url TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_partners_owner ON partners(owner_id);
CREATE INDEX idx_partners_type ON partners(partner_type);
CREATE INDEX idx_partners_archived ON partners(is_archived);
