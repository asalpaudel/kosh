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

    private String resource(String path) throws IOException {
        try (var stream = getClass().getResourceAsStream(path)) {
            assertThat(stream).as("resource %s", path).isNotNull();
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
