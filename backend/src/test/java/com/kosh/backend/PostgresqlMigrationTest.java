package com.kosh.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;

class PostgresqlMigrationTest {

    @Test
    void baselineIsPostgresqlOnlyAndCoversEveryJpaTable() throws IOException {
        String migration = resource("/db/migration/V1__postgresql_baseline.sql");

        assertThat(migration)
                .doesNotContainIgnoringCase("mysql", "longblob", "auto_increment", "date_format")
                .contains(
                        "CREATE TABLE networks",
                        "CREATE TABLE users",
                        "CREATE TABLE fixed_deposits",
                        "CREATE TABLE saving_accounts",
                        "CREATE TABLE loan_packages",
                        "CREATE TABLE fixed_deposit_applications",
                        "CREATE TABLE saving_account_applications",
                        "CREATE TABLE loan_applications",
                        "CREATE TABLE repayment_schedules",
                        "CREATE TABLE transactions",
                        "CREATE TABLE activity_logs");
    }

    @Test
    void developmentSeedCoversTheCompleteDemonstrationWorkflow() throws IOException {
        String seed = resource("/db/devseed/R__development_seed.sql");

        assertThat(seed)
                .contains(
                        "INSERT INTO networks",
                        "INSERT INTO users",
                        "INSERT INTO fixed_deposits",
                        "INSERT INTO saving_accounts",
                        "INSERT INTO loan_packages",
                        "INSERT INTO saving_account_applications",
                        "INSERT INTO fixed_deposit_applications",
                        "INSERT INTO loan_applications",
                        "INSERT INTO repayment_schedules",
                        "INSERT INTO transactions",
                        "INSERT INTO activity_logs",
                        "${seedPasswordHash}");
    }

    @Test
    void transactionIdempotencyIsUniqueInsideEachCooperative() throws IOException {
        String migration = resource("/db/migration/V6__transaction_idempotency.sql");
        assertThat(migration).contains(
                "idempotency_key",
                "request_fingerprint",
                "transactions_network_idempotency_uq",
                "ON transactions (network_id, idempotency_key)");
    }

    @Test
    void activityHistoryRejectsUpdatesAndDeletes() throws IOException {
        String migration = resource("/db/migration/V7__append_only_activity_log.sql");
        assertThat(migration).contains(
                "BEFORE UPDATE OR DELETE ON activity_logs",
                "activity logs are append-only");
    }

    @Test
    void persistentEventTimesAreMigratedToUtcInstants() throws IOException {
        String migration = resource("/db/migration/V8__utc_timestamps.sql");
        assertThat(migration)
                .contains("timestamp with time zone", "AT TIME ZONE 'Asia/Kathmandu'")
                .contains("ALTER TABLE users", "ALTER TABLE journal_entries", "ALTER TABLE activity_logs");
    }

    @Test
    void shareRegisterIsAppendOnlyAndMoneyUsesNumericColumns() throws IOException {
        String migration = resource("/db/migration/V9__share_capital.sql");
        assertThat(migration)
                .contains("CREATE TABLE share_settings", "CREATE TABLE share_certificates",
                        "CREATE TABLE share_transactions", "numeric(18,2)",
                        "share_transactions_append_only", "ON CONFLICT (network_id, code) DO NOTHING");
    }

    @Test
    void closeFrameworkHasUniqueProcessingLocksAndPeriodReopenAuditFields() throws IOException {
        String migration = resource("/db/migration/V10__accounting_close.sql");
        assertThat(migration).contains(
                "CREATE TABLE processing_date_locks", "processing_date_lock_uq",
                "CREATE TABLE accounting_periods", "reopened_at", "reopen_reason");
    }

    @Test
    void savingsInterestHasProductRulesAndIdempotentDailyAccrualKey() throws IOException {
        String migration = resource("/db/migration/V11__savings_interest_accrual.sql");
        assertThat(migration).contains(
                "MINIMUM_MONTHLY_BALANCE", "DAILY_PRODUCT", "AVERAGE_BALANCE",
                "capitalization_frequency", "day_count_convention", "numeric(18,2)",
                "savings_interest_accrual_uq UNIQUE (saving_account_id, member_id, accrual_date)");
    }

    @Test
    void loanSecurityEnforcesLtvLandEvidenceAndUniqueGuarantors() throws IOException {
        String migration = resource("/db/migration/V12__loan_security.sql");
        assertThat(migration).contains(
                "max_loan_to_value_percent", "guarantor_exposure_limit",
                "CREATE TABLE loan_collaterals", "CREATE TABLE loan_guarantors",
                "loan_collateral_land_ck", "loan_guarantor_member_uq",
                "ownership_document_reference", "consent_reference");
    }

    @Test
    void loanRiskMigrationHasConfigurableBucketsDailyClassificationAndProvisionAccounts() throws IOException {
        String migration = resource("/db/migration/V13__loan_classification_and_provisioning.sql");
        assertThat(migration).contains(
                "CREATE TABLE loan_risk_settings", "watchlist_days", "substandard_days",
                "doubtful_days", "loss_days", "CREATE TABLE loan_classifications",
                "loan_classification_daily_uq", "1190", "Loan Loss Provision",
                "5200", "Provision Expense", "numeric(18,2)");
    }

    private String resource(String path) throws IOException {
        try (var stream = getClass().getResourceAsStream(path)) {
            assertThat(stream).as("resource %s", path).isNotNull();
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
