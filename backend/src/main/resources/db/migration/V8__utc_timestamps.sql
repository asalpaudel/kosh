-- Existing timestamp-without-zone values were written as Nepal local time. Convert them
-- explicitly, then store instants as timestamptz so the database normalises them to UTC.
ALTER TABLE users
    ALTER COLUMN created_at TYPE timestamp with time zone USING created_at AT TIME ZONE 'Asia/Kathmandu',
    ALTER COLUMN two_factor_expiry TYPE timestamp with time zone USING two_factor_expiry AT TIME ZONE 'Asia/Kathmandu',
    ALTER COLUMN trusted_device_expiry TYPE timestamp with time zone USING trusted_device_expiry AT TIME ZONE 'Asia/Kathmandu';

ALTER TABLE fixed_deposit_applications
    ALTER COLUMN application_date TYPE timestamp with time zone USING application_date AT TIME ZONE 'Asia/Kathmandu',
    ALTER COLUMN review_date TYPE timestamp with time zone USING review_date AT TIME ZONE 'Asia/Kathmandu';

ALTER TABLE saving_account_applications
    ALTER COLUMN application_date TYPE timestamp with time zone USING application_date AT TIME ZONE 'Asia/Kathmandu',
    ALTER COLUMN review_date TYPE timestamp with time zone USING review_date AT TIME ZONE 'Asia/Kathmandu';

ALTER TABLE loan_applications
    ALTER COLUMN application_date TYPE timestamp with time zone USING application_date AT TIME ZONE 'Asia/Kathmandu',
    ALTER COLUMN review_date TYPE timestamp with time zone USING review_date AT TIME ZONE 'Asia/Kathmandu';

ALTER TABLE journal_entries
    ALTER COLUMN posted_at TYPE timestamp with time zone USING posted_at AT TIME ZONE 'Asia/Kathmandu';

ALTER TABLE activity_logs
    ALTER COLUMN timestamp TYPE timestamp with time zone USING timestamp AT TIME ZONE 'Asia/Kathmandu';
