-- Money and rates move off binary floating point.
--
-- `double precision` cannot represent 0.10 exactly, so balances, interest and EMI drift
-- as soon as they are added up repeatedly. A passbook that has to reconcile against an
-- auditor's spreadsheet needs exact decimal arithmetic: numeric(18,2) for amounts,
-- numeric(5,2) for percentage rates. Existing values are rounded to the new scale.

ALTER TABLE networks
    ALTER COLUMN package_price TYPE numeric(18,2) USING round(package_price::numeric, 2);

ALTER TABLE users
    ALTER COLUMN balance TYPE numeric(18,2) USING round(balance::numeric, 2);

ALTER TABLE fixed_deposits
    ALTER COLUMN interest_rate TYPE numeric(5,2) USING round(interest_rate::numeric, 2),
    ALTER COLUMN min_amount TYPE numeric(18,2) USING round(min_amount::numeric, 2);

ALTER TABLE saving_accounts
    ALTER COLUMN interest_rate TYPE numeric(5,2) USING round(interest_rate::numeric, 2),
    ALTER COLUMN min_balance TYPE numeric(18,2) USING round(min_balance::numeric, 2);

ALTER TABLE loan_packages
    ALTER COLUMN interest_rate TYPE numeric(5,2) USING round(interest_rate::numeric, 2),
    ALTER COLUMN max_amount TYPE numeric(18,2) USING round(max_amount::numeric, 2);

ALTER TABLE fixed_deposit_applications
    ALTER COLUMN deposit_amount TYPE numeric(18,2) USING round(deposit_amount::numeric, 2),
    ALTER COLUMN interest_rate TYPE numeric(5,2) USING round(interest_rate::numeric, 2),
    ALTER COLUMN maturity_amount TYPE numeric(18,2) USING round(maturity_amount::numeric, 2);

ALTER TABLE saving_account_applications
    ALTER COLUMN initial_deposit TYPE numeric(18,2) USING round(initial_deposit::numeric, 2);

ALTER TABLE loan_applications
    ALTER COLUMN requested_amount TYPE numeric(18,2) USING round(requested_amount::numeric, 2),
    ALTER COLUMN approved_amount TYPE numeric(18,2) USING round(approved_amount::numeric, 2),
    ALTER COLUMN interest_rate TYPE numeric(5,2) USING round(interest_rate::numeric, 2);

ALTER TABLE repayment_schedules
    ALTER COLUMN principal_amount TYPE numeric(18,2) USING round(principal_amount::numeric, 2),
    ALTER COLUMN interest_amount TYPE numeric(18,2) USING round(interest_amount::numeric, 2),
    ALTER COLUMN total_due TYPE numeric(18,2) USING round(total_due::numeric, 2);

ALTER TABLE transactions
    ALTER COLUMN amount TYPE numeric(18,2) USING round(amount::numeric, 2),
    ALTER COLUMN network_reserve TYPE numeric(18,2) USING round(network_reserve::numeric, 2);
