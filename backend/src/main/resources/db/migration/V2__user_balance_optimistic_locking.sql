-- Optimistic locking for the member balance.
--
-- Balance is read, adjusted and written back in the same request. Without a version
-- column two concurrent tellers can both read the same balance and the second write
-- silently discards the first one's movement. The version check turns that lost update
-- into a failed transaction instead.
ALTER TABLE users ADD COLUMN version bigint NOT NULL DEFAULT 0;
