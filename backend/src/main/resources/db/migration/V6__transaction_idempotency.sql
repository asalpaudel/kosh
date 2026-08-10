-- Client-generated operation keys make retries safe. Existing/internal rows remain nullable;
-- every externally submitted transaction is required to populate both columns in code.
ALTER TABLE transactions
    ADD COLUMN idempotency_key varchar(36),
    ADD COLUMN request_fingerprint varchar(43);

CREATE UNIQUE INDEX transactions_network_idempotency_uq
    ON transactions (network_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

ALTER TABLE transactions
    ADD CONSTRAINT transactions_idempotency_pair_ck CHECK (
        (idempotency_key IS NULL) = (request_fingerprint IS NULL)
    );
