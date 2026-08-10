INSERT INTO networks (
    id, registered_id, name, address, created_at, phone, pan_number,
    staff_count, user_count, package_type, package_price, admin_limit, user_limit
) VALUES
    (1, 'REG-KTM-001', 'Himalayan Community Cooperative', 'Kathmandu', '2025-01-15', '01-5550101', 'PAN-100001', 1, 4, 'Premium', 10000, 2, 30),
    (2, 'REG-PKR-002', 'Lakeside Savings Cooperative', 'Pokhara', '2025-03-01', '061-5550102', 'PAN-100002', 1, 3, 'Basic', 5000, 1, 15)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (
    id, name, email, phone, role, sahakari, sahakari_id, password, status,
    dob, address, balance, created_at
) VALUES
    (1, 'Himalayan Administrator', 'admin.himalayan@example.test', '9800000001', 'admin', 'Himalayan Community Cooperative', 1, '${seedPasswordHash}', 'Active', '1990-01-10', 'Kathmandu', 0, '2025-01-16 09:00:00'),
    (2, 'Aarav Demo Member', 'aarav@example.test', '9800000011', 'member', 'Himalayan Community Cooperative', 1, '${seedPasswordHash}', 'Active', '1995-04-12', 'Kathmandu', 82500, '2025-01-20 10:00:00'),
    (3, 'Maya Demo Member', 'maya@example.test', '9800000012', 'member', 'Himalayan Community Cooperative', 1, '${seedPasswordHash}', 'Active', '1993-08-21', 'Bhaktapur', 43000, '2025-02-01 11:00:00'),
    (4, 'Pending Himalayan Member', 'pending.himalayan@example.test', '9800000013', 'member', 'Himalayan Community Cooperative', 1, '${seedPasswordHash}', 'Pending', '1998-03-14', 'Lalitpur', 0, '2026-07-01 09:30:00'),
    (5, 'Lakeside Administrator', 'admin.lakeside@example.test', '9800000002', 'admin', 'Lakeside Savings Cooperative', 2, '${seedPasswordHash}', 'Active', '1989-11-05', 'Pokhara', 0, '2025-03-02 09:00:00'),
    (6, 'Sita Demo Member', 'sita@example.test', '9800000021', 'member', 'Lakeside Savings Cooperative', 2, '${seedPasswordHash}', 'Active', '1996-06-18', 'Pokhara', 61000, '2025-03-10 10:00:00'),
    (7, 'Rohan Demo Member', 'rohan@example.test', '9800000022', 'member', 'Lakeside Savings Cooperative', 2, '${seedPasswordHash}', 'Active', '1992-09-09', 'Lekhnath', 27500, '2025-04-05 10:00:00'),
    (8, 'Rejected Lakeside Member', 'rejected.lakeside@example.test', '9800000023', 'member', 'Lakeside Savings Cooperative', 2, '${seedPasswordHash}', 'Rejected', '2000-02-20', 'Pokhara', 0, '2026-06-15 10:00:00')
ON CONFLICT (id) DO UPDATE SET password = EXCLUDED.password;

INSERT INTO fixed_deposits (id, name, interest_rate, min_duration, min_amount, description, network_id) VALUES
    (1, 'Himalayan 12 Month FD', 8.5, 12, 25000, 'Twelve-month fixed deposit for established members.', 1),
    (2, 'Himalayan 24 Month FD', 9.25, 24, 50000, 'Longer-term fixed deposit with a higher annual rate.', 1),
    (3, 'Lakeside Standard FD', 8.0, 12, 20000, 'Standard fixed deposit for Lakeside members.', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO saving_accounts (id, name, interest_rate, min_balance, description, network_id) VALUES
    (1, 'Himalayan Regular Savings', 4.5, 1000, 'Everyday member savings account.', 1),
    (2, 'Himalayan Youth Savings', 5.0, 500, 'Low-minimum savings account.', 1),
    (3, 'Lakeside Regular Savings', 4.25, 1000, 'Everyday savings for Lakeside members.', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO loan_packages (id, name, interest_rate, max_amount, max_duration, description, network_id) VALUES
    (1, 'Himalayan Personal Loan', 12.0, 500000, 36, 'General-purpose member loan.', 1),
    (2, 'Himalayan Microenterprise Loan', 10.5, 1000000, 60, 'Small-business financing for members.', 1),
    (3, 'Lakeside Personal Loan', 12.5, 400000, 36, 'General-purpose Lakeside member loan.', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO saving_account_applications (
    id, user_id, saving_account_id, network_id, initial_deposit, status,
    transaction_type, application_date, review_date, reviewed_by, review_notes
) VALUES
    (1, 2, 1, 1, 15000, 'APPROVED', 'DEPOSIT', '2025-02-02 10:00:00', '2025-02-02 14:00:00', 1, 'Identity and initial deposit verified.'),
    (2, 3, 1, 1, 10000, 'APPROVED', 'DEPOSIT', '2025-02-10 10:00:00', '2025-02-10 15:00:00', 1, 'Approved after member verification.'),
    (3, 6, 3, 2, 12000, 'APPROVED', 'DEPOSIT', '2025-03-12 10:00:00', '2025-03-12 13:00:00', 5, 'Approved.'),
    (4, 7, 3, 2, 5000, 'PENDING', 'DEPOSIT', '2026-08-01 11:00:00', NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO fixed_deposit_applications (
    id, user_id, fixed_deposit_id, network_id, deposit_amount, deposit_term,
    interest_rate, maturity_date, maturity_amount, nominee_name, status,
    transaction_type, application_date, review_date, reviewed_by, review_notes
) VALUES
    (1, 2, 1, 1, 50000, 12, 8.5, '2026-02-15', 54250, 'Demo Nominee A', 'APPROVED', 'DEPOSIT', '2025-02-15 09:00:00', '2025-02-15 12:00:00', 1, 'Funds and nominee verified.'),
    (2, 3, 2, 1, 75000, 24, 9.25, '2027-04-01', 88875, 'Demo Nominee B', 'PENDING', 'DEPOSIT', '2025-04-01 09:00:00', NULL, NULL, NULL),
    (3, 6, 3, 2, 30000, 12, 8.0, '2026-05-10', 32400, 'Demo Nominee C', 'REJECTED', 'DEPOSIT', '2025-05-10 09:00:00', '2025-05-11 09:00:00', 5, 'Requested supporting information was not supplied.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO loan_applications (
    id, user_id, loan_package_id, network_id, requested_amount, approved_amount,
    interest_rate, duration_in_months, start_date, next_payment_date, purpose,
    status, transaction_type, application_date, review_date, reviewed_by, review_notes
) VALUES
    (1, 2, 1, 1, 120000, 100000, 12.0, 12, '2025-06-01', '2025-07-01', 'Home equipment purchase', 'APPROVED', 'WITHDRAW', '2025-05-25 10:00:00', '2025-05-28 14:00:00', 1, 'Approved within repayment capacity.'),
    (2, 3, 2, 1, 350000, NULL, NULL, NULL, NULL, NULL, 'Expand a demonstration retail business', 'PENDING', 'WITHDRAW', '2026-08-02 10:00:00', NULL, NULL, NULL),
    (3, 7, 3, 2, 90000, NULL, NULL, NULL, NULL, NULL, 'Education expenses', 'REJECTED', 'WITHDRAW', '2025-07-01 10:00:00', '2025-07-03 10:00:00', 5, 'Debt-service ratio exceeded policy.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO repayment_schedules (
    id, loan_application_id, installment_number, due_date,
    principal_amount, interest_amount, total_due, status, paid_date
) VALUES
    (1, 1, 1, '2025-07-01', 7884.88, 1000.00, 8884.88, 'PAID', '2025-07-01'),
    (2, 1, 2, '2025-08-01', 7963.73, 921.15, 8884.88, 'PAID', '2025-08-01'),
    (3, 1, 3, '2025-09-01', 8043.37, 841.51, 8884.88, 'PAID', '2025-09-02'),
    (4, 1, 4, '2025-10-01', 8123.80, 761.08, 8884.88, 'PAID', '2025-10-01'),
    (5, 1, 5, '2025-11-01', 8205.04, 679.84, 8884.88, 'PAID', '2025-11-01'),
    (6, 1, 6, '2025-12-01', 8287.09, 597.79, 8884.88, 'PAID', '2025-12-01'),
    (7, 1, 7, '2026-01-01', 8369.96, 514.92, 8884.88, 'PAID', '2026-01-01'),
    (8, 1, 8, '2026-02-01', 8453.66, 431.22, 8884.88, 'PAID', '2026-02-01'),
    (9, 1, 9, '2026-03-01', 8538.20, 346.68, 8884.88, 'PAID', '2026-03-01'),
    (10, 1, 10, '2026-04-01', 8623.58, 261.30, 8884.88, 'PAID', '2026-04-01'),
    (11, 1, 11, '2026-05-01', 8709.82, 175.06, 8884.88, 'OVERDUE', NULL),
    (12, 1, 12, '2026-06-01', 8796.87, 88.01, 8884.88, 'PENDING', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transactions (
    id, voucher_id, date, status, user_id, user_name, network_id, type, amount,
    narration, application_id, application_type, network_reserve, mode, fy_type,
    account_head, network_ledger, direction, payment_method, received_by
) VALUES
    (1, 'HCC-2025-0001', '2025-02-02', 'Success', 2, 'Aarav Demo Member', 1, 'Savings (Credit)', 15000, 'Initial savings deposit', 1, 'saving-account', 15000, 'member', 'Current FY', 'Savings', 'Bank', 'Credit', 'Bank Transfer', 'Himalayan Administrator'),
    (2, 'HCC-2025-0002', '2025-02-10', 'Success', 3, 'Maya Demo Member', 1, 'Savings (Credit)', 10000, 'Initial savings deposit', 2, 'saving-account', 25000, 'member', 'Current FY', 'Savings', 'Cash', 'Credit', 'Cash', 'Himalayan Administrator'),
    (3, 'HCC-2025-0003', '2025-02-15', 'Success', 2, 'Aarav Demo Member', 1, 'Fixed Deposit (Credit)', 50000, 'Fixed-deposit funding', 1, 'fixed-deposit', 75000, 'member', 'Current FY', 'Fixed Deposit', 'Bank', 'Credit', 'Bank Transfer', 'Himalayan Administrator'),
    (4, 'HCC-2025-0004', '2025-06-01', 'Success', 2, 'Aarav Demo Member', 1, 'Loan Disbursement (Debit)', 100000, 'Approved loan disbursement', 1, 'loan', -25000, 'member', 'Current FY', 'Loan', 'Bank', 'Debit', 'Bank Transfer', 'Himalayan Administrator'),
    (5, 'HCC-2025-0005', '2025-07-01', 'Success', 2, 'Aarav Demo Member', 1, 'Loan Repayment (Credit)', 8884.88, 'Loan installment 1', 1, 'loan-repayment', -16115.12, 'member', 'Current FY', 'Loan', 'Bank', 'Credit', 'Bank Transfer', 'Himalayan Administrator'),
    (6, 'LSC-2025-0001', '2025-03-12', 'Success', 6, 'Sita Demo Member', 2, 'Savings (Credit)', 12000, 'Initial savings deposit', 3, 'saving-account', 12000, 'member', 'Current FY', 'Savings', 'Cash', 'Credit', 'Cash', 'Lakeside Administrator'),
    (7, 'LSC-2026-0002', '2026-07-15', 'Success', NULL, NULL, 2, 'Office Expense (Debit)', 2500, 'Monthly office supplies', NULL, NULL, 9500, 'network', 'Current FY', 'Office Expense', 'Cash', 'Debit', 'Cash', 'Lakeside Administrator'),
    (8, 'HCC-2026-0006', '2026-07-20', 'Frozen', 3, 'Maya Demo Member', 1, 'Savings Withdrawal (Debit)', 5000, 'Pending compliance review', NULL, NULL, -21115.12, 'member', 'Current FY', 'Savings', 'Bank', 'Debit', 'Bank Transfer', 'Himalayan Administrator')
ON CONFLICT (id) DO NOTHING;

INSERT INTO activity_logs (id, actor_name, role, sahakari_id, action, details, timestamp) VALUES
    (1, 'System Seed', 'system', 1, 'CREATE_NETWORK', 'Created Himalayan demonstration cooperative.', '2025-01-15 08:00:00'),
    (2, 'Himalayan Administrator', 'admin', 1, 'APPROVE_USER', 'Approved Aarav Demo Member.', '2025-01-20 10:05:00'),
    (3, 'Himalayan Administrator', 'admin', 1, 'APPROVE_APPLICATION', 'Approved demonstration personal loan.', '2025-05-28 14:05:00'),
    (4, 'System Seed', 'system', 2, 'CREATE_NETWORK', 'Created Lakeside demonstration cooperative.', '2025-03-01 08:00:00'),
    (5, 'Lakeside Administrator', 'admin', 2, 'REJECT_APPLICATION', 'Rejected demonstration loan application.', '2025-07-03 10:05:00')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('networks', 'id'), (SELECT max(id) FROM networks), true);
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT max(id) FROM users), true);
SELECT setval(pg_get_serial_sequence('fixed_deposits', 'id'), (SELECT max(id) FROM fixed_deposits), true);
SELECT setval(pg_get_serial_sequence('saving_accounts', 'id'), (SELECT max(id) FROM saving_accounts), true);
SELECT setval(pg_get_serial_sequence('loan_packages', 'id'), (SELECT max(id) FROM loan_packages), true);
SELECT setval(pg_get_serial_sequence('fixed_deposit_applications', 'id'), (SELECT max(id) FROM fixed_deposit_applications), true);
SELECT setval(pg_get_serial_sequence('saving_account_applications', 'id'), (SELECT max(id) FROM saving_account_applications), true);
SELECT setval(pg_get_serial_sequence('loan_applications', 'id'), (SELECT max(id) FROM loan_applications), true);
SELECT setval(pg_get_serial_sequence('repayment_schedules', 'id'), (SELECT max(id) FROM repayment_schedules), true);
SELECT setval(pg_get_serial_sequence('transactions', 'id'), (SELECT max(id) FROM transactions), true);
SELECT setval(pg_get_serial_sequence('activity_logs', 'id'), (SELECT max(id) FROM activity_logs), true);
