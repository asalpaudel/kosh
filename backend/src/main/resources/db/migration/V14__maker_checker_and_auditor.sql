ALTER TABLE networks
    ADD COLUMN maker_checker_threshold numeric(18,2) NOT NULL DEFAULT 100000.00,
    ADD CONSTRAINT networks_maker_checker_threshold_ck CHECK (maker_checker_threshold >= 0);

ALTER TABLE users DROP CONSTRAINT users_role_ck;
ALTER TABLE users ADD CONSTRAINT users_role_ck
    CHECK (lower(role) IN ('member', 'admin', 'auditor'));

ALTER TABLE transactions
    ADD COLUMN approval_status varchar(20) NOT NULL DEFAULT 'NOT_REQUIRED',
    ADD COLUMN maker_id bigint REFERENCES users(id) ON DELETE RESTRICT,
    ADD COLUMN made_at timestamp with time zone,
    ADD COLUMN checker_id bigint REFERENCES users(id) ON DELETE RESTRICT,
    ADD COLUMN checked_at timestamp with time zone,
    ADD COLUMN checker_notes varchar(1000),
    ADD COLUMN package_id bigint,
    ADD COLUMN requested_term integer,
    ADD CONSTRAINT transaction_approval_status_ck CHECK (
        approval_status IN ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED')),
    ADD CONSTRAINT transaction_maker_checker_ck CHECK (
        checker_id IS NULL OR maker_id IS NULL OR checker_id <> maker_id);

CREATE INDEX transactions_network_approval_idx
    ON transactions (network_id, approval_status, date DESC);
