
ALTER TABLE clients ADD COLUMN contact_person VARCHAR(255);
ALTER TABLE clients ADD COLUMN status VARCHAR(30) DEFAULT 'new';
ALTER TABLE clients ADD COLUMN entity_type VARCHAR(30) DEFAULT 'individual';
ALTER TABLE clients ADD COLUMN org_name VARCHAR(255);
ALTER TABLE clients ADD COLUMN inn VARCHAR(20);
ALTER TABLE clients ADD COLUMN ogrn VARCHAR(20);
ALTER TABLE clients ADD COLUMN kpp VARCHAR(20);
ALTER TABLE clients ADD COLUMN legal_address TEXT;
ALTER TABLE clients ADD COLUMN bank_name VARCHAR(255);
ALTER TABLE clients ADD COLUMN bik VARCHAR(20);
ALTER TABLE clients ADD COLUMN account_number VARCHAR(30);
ALTER TABLE clients ADD COLUMN corr_account VARCHAR(30);
ALTER TABLE clients ALTER COLUMN phone SET DEFAULT '';

CREATE TABLE client_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id),
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_notes_client ON client_notes(client_id);
