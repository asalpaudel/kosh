CREATE TABLE ledger_checkpoints (
    id bigserial PRIMARY KEY,
    network_id bigint NOT NULL REFERENCES networks(id) ON DELETE RESTRICT,
    checkpoint_date date NOT NULL,
    sequence_no bigint NOT NULL CHECK (sequence_no >= 0),
    entry_hash varchar(64) NOT NULL CHECK (entry_hash ~ '^[0-9a-f]{64}$'),
    created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at timestamp with time zone,
    recipient_count integer NOT NULL DEFAULT 0 CHECK (recipient_count >= 0),
    CONSTRAINT ledger_checkpoint_network_date_uq UNIQUE (network_id, checkpoint_date)
);

CREATE INDEX ledger_checkpoints_network_date_idx
    ON ledger_checkpoints (network_id, checkpoint_date DESC);

CREATE OR REPLACE FUNCTION reject_ledger_checkpoint_mutation()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'ledger checkpoints are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ledger_checkpoints_append_only
BEFORE UPDATE OR DELETE ON ledger_checkpoints
FOR EACH ROW EXECUTE FUNCTION reject_ledger_checkpoint_mutation();
