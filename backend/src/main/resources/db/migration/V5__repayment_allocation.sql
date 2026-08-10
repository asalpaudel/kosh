-- Tracks how much of each installment has actually been paid.
--
-- Until now a repayment only flipped a status, so a part payment was indistinguishable
-- from a full one and there was nothing to allocate a later payment against. Allocation
-- runs interest first, then principal, which is what decides how much of a member's
-- payment is the cooperative's income rather than a reduction of what they owe.
ALTER TABLE repayment_schedules
    ADD COLUMN interest_paid numeric(18,2) NOT NULL DEFAULT 0 CHECK (interest_paid >= 0),
    ADD COLUMN principal_paid numeric(18,2) NOT NULL DEFAULT 0 CHECK (principal_paid >= 0);

-- Installments already marked PAID predate this column, so record them as settled in full.
UPDATE repayment_schedules
   SET interest_paid = interest_amount,
       principal_paid = principal_amount
 WHERE status = 'PAID';
