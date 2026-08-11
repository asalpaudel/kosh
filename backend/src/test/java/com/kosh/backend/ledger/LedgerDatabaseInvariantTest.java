package com.kosh.backend.ledger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

/**
 * Proves the ledger invariants hold in the database, not merely in Java — application code
 * can be bypassed, and a ledger that can be bypassed is not evidence of anything.
 *
 * <p>Needs a real PostgreSQL. Set {@code KOSH_TEST_DB_URL} (plus {@code KOSH_TEST_DB_USER}
 * and {@code KOSH_TEST_DB_PASSWORD} where required) to a database the test may create and
 * drop a scratch schema in; the class is skipped when it is absent.
 */
@EnabledIfEnvironmentVariable(named = "KOSH_TEST_DB_URL", matches = ".+")
class LedgerDatabaseInvariantTest {

    private static Connection connection;

    @BeforeAll
    static void createSchema() throws SQLException {
        connection = DriverManager.getConnection(
                System.getenv("KOSH_TEST_DB_URL"),
                System.getenv().getOrDefault("KOSH_TEST_DB_USER", System.getProperty("user.name")),
                System.getenv().getOrDefault("KOSH_TEST_DB_PASSWORD", ""));
        connection.setAutoCommit(true);

        try (Statement statement = connection.createStatement()) {
            statement.execute("DROP SCHEMA IF EXISTS ledger_invariant_test CASCADE");
            statement.execute("CREATE SCHEMA ledger_invariant_test");
            statement.execute("SET search_path TO ledger_invariant_test");
            statement.execute(migration("V1__postgresql_baseline.sql"));
            statement.execute(migration("V2__user_balance_optimistic_locking.sql"));
            statement.execute(migration("V3__money_as_numeric.sql"));
            statement.execute(migration("V4__double_entry_ledger.sql"));
            statement.execute(migration("V10__accounting_close.sql"));
            statement.execute(migration("V11__savings_interest_accrual.sql"));
            statement.execute(migration("V12__loan_security.sql"));
            statement.execute(migration("V13__loan_classification_and_provisioning.sql"));
            statement.execute(migration("V14__maker_checker_and_auditor.sql"));
            statement.execute(migration("V15__member_transparency_checkpoints.sql"));

            statement.execute("""
                    INSERT INTO networks (id, registered_id, name, package_type, package_price)
                    VALUES (1, 'REG-1', 'Test Sahakari', 'Basic', 0)
                    """);
            statement.execute("""
                    INSERT INTO accounts (id, network_id, code, name, type) VALUES
                        (1, 1, '1000', 'Cash in Hand', 'ASSET'),
                        (2, 1, '2000', 'Member Savings', 'LIABILITY')
                    """);
        }
    }

    @AfterAll
    static void dropSchema() throws SQLException {
        if (connection == null) return;
        try (Statement statement = connection.createStatement()) {
            statement.execute("DROP SCHEMA IF EXISTS ledger_invariant_test CASCADE");
        }
        connection.close();
    }

    @Test
    void balancedEntryCommits() throws SQLException {
        postEntry(101, "500.00");

        assertThat(countLines(101)).isEqualTo(2);
    }

    @Test
    void unbalancedEntryIsRejectedAtCommit() throws SQLException {
        connection.setAutoCommit(false);
        try {
            long entryId = newEntry(102);
            execute(line(entryId, 1, "500.00", "0"));
            execute(line(entryId, 2, "0", "400.00"));

            assertThatThrownBy(connection::commit)
                    .isInstanceOf(SQLException.class)
                    .hasMessageContaining("unbalanced");
        } finally {
            connection.rollback();
            connection.setAutoCommit(true);
        }
    }

    @Test
    void singleLineEntryIsRejectedAtCommit() throws SQLException {
        connection.setAutoCommit(false);
        try {
            long entryId = newEntry(103);
            execute(line(entryId, 1, "500.00", "0"));

            assertThatThrownBy(connection::commit)
                    .isInstanceOf(SQLException.class)
                    .hasMessageContaining("at least two lines");
        } finally {
            connection.rollback();
            connection.setAutoCommit(true);
        }
    }

    @Test
    void aLineCannotCarryBothADebitAndACredit() throws SQLException {
        connection.setAutoCommit(false);
        try {
            long entryId = newEntry(104);
            assertThatThrownBy(() -> execute(line(entryId, 1, "500.00", "500.00")))
                    .isInstanceOf(SQLException.class)
                    .hasMessageContaining("journal_lines_single_side_ck");
        } finally {
            connection.rollback();
            connection.setAutoCommit(true);
        }
    }

    @Test
    void postedEntriesCannotBeUpdatedOrDeleted() throws SQLException {
        long entryId = postEntry(105, "700.00");

        assertThatThrownBy(() -> execute(
                "UPDATE journal_lines SET debit = 1 WHERE entry_id = " + entryId))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("append-only");

        assertThatThrownBy(() -> execute("DELETE FROM journal_entries WHERE id = " + entryId))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("append-only");

        assertThat(countLines(entryId)).isEqualTo(2);
    }

    @Test
    void processingDateLockCanOnlyBeAcquiredOnce() throws SQLException {
        execute("""
                INSERT INTO processing_date_locks (network_id, process_type, processing_date, scope_key)
                VALUES (1, 'DAY_END', DATE '2026-08-10', 'NETWORK')
                """);

        assertThatThrownBy(() -> execute("""
                INSERT INTO processing_date_locks (network_id, process_type, processing_date, scope_key)
                VALUES (1, 'DAY_END', DATE '2026-08-10', 'NETWORK')
                """))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("processing_date_lock_uq");
    }

    @Test
    void accountingPeriodCannotEndBeforeItStarts() {
        assertThatThrownBy(() -> execute("""
                INSERT INTO accounting_periods
                    (network_id, period_type, period_start, period_end, closed_at, closed_by)
                VALUES (1, 'MONTH_END', DATE '2026-08-10', DATE '2026-08-01', CURRENT_TIMESTAMP, 'Admin')
                """))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("accounting_period_dates_ck");
    }

    @Test
    void publishedCheckpointCannotBeChangedOrDeleted() throws SQLException {
        execute("""
                INSERT INTO ledger_checkpoints (network_id, checkpoint_date, sequence_no, entry_hash)
                VALUES (1, DATE '2026-08-10', 0, repeat('0', 64))
                """);
        assertThatThrownBy(() -> execute("UPDATE ledger_checkpoints SET sequence_no = 1 WHERE network_id = 1"))
                .isInstanceOf(SQLException.class).hasMessageContaining("append-only");
        assertThatThrownBy(() -> execute("DELETE FROM ledger_checkpoints WHERE network_id = 1"))
                .isInstanceOf(SQLException.class).hasMessageContaining("append-only");
    }

    /** Writes a complete balanced entry in one transaction, the way the application does. */
    private static long postEntry(long id, String amount) throws SQLException {
        connection.setAutoCommit(false);
        try {
            newEntry(id);
            execute(line(id, 1, amount, "0"));
            execute(line(id, 2, "0", amount));
            connection.commit();
        } catch (SQLException e) {
            connection.rollback();
            throw e;
        } finally {
            connection.setAutoCommit(true);
        }
        return id;
    }

    private static long newEntry(long id) throws SQLException {
        execute("""
                INSERT INTO journal_entries
                    (id, network_id, sequence_no, entry_date, narration, previous_hash, entry_hash)
                VALUES (%d, 1, %d, DATE '2026-08-10', 'test entry', repeat('0', 64), '%s')
                """.formatted(id, id, Long.toHexString(id).repeat(1) + "f".repeat(64 - Long.toHexString(id).length())));
        return id;
    }

    private static String line(long entryId, long accountId, String debit, String credit) {
        return """
               INSERT INTO journal_lines (entry_id, account_id, debit, credit)
               VALUES (%d, %d, %s, %s)
               """.formatted(entryId, accountId, debit, credit);
    }

    private static void execute(String sql) throws SQLException {
        try (Statement statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }

    private static int countLines(long entryId) throws SQLException {
        try (Statement statement = connection.createStatement();
             var rows = statement.executeQuery("SELECT COUNT(*) FROM journal_lines WHERE entry_id = " + entryId)) {
            rows.next();
            return rows.getInt(1);
        }
    }

    private static String migration(String name) {
        try (var stream = LedgerDatabaseInvariantTest.class.getResourceAsStream("/db/migration/" + name)) {
            return new String(stream.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Cannot read migration " + name, e);
        }
    }
}
