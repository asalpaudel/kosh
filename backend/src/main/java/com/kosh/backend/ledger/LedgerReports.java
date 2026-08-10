package com.kosh.backend.ledger;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kosh.backend.model.AccountType;
import com.kosh.backend.model.JournalEntry;
import com.kosh.backend.model.Network;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.JournalEntryRepository;
import com.kosh.backend.repository.JournalLineRepository;
import com.kosh.backend.repository.UserRepository;
import com.kosh.backend.service.Money;

/**
 * Everything the ledger can be asked, as opposed to told: the statements an accountant
 * reads, the chain check that proves the history was not rewritten, and the drift check
 * between the cached member balance and the balance the journal actually implies.
 */
@Service
@Transactional(readOnly = true)
public class LedgerReports {

    /** Stands in for "since the cooperative began" — earlier than any plausible entry date. */
    private static final LocalDate BEGINNING = LocalDate.of(1900, 1, 1);

    private final JournalLineRepository lineRepo;
    private final JournalEntryRepository entryRepo;
    private final UserRepository userRepo;
    private final LedgerService ledger;

    public LedgerReports(JournalLineRepository lineRepo,
                         JournalEntryRepository entryRepo,
                         UserRepository userRepo,
                         LedgerService ledger) {
        this.lineRepo = lineRepo;
        this.entryRepo = entryRepo;
        this.userRepo = userRepo;
        this.ledger = ledger;
    }

    public record Row(String code, String name, AccountType type,
                      BigDecimal debit, BigDecimal credit, BigDecimal balance) {
    }

    /**
     * Debits and credits per account. If the totals differ, something has bypassed the
     * posting service — which is exactly what this report exists to reveal.
     */
    public Map<String, Object> trialBalance(Long networkId, LocalDate asOf) {
        List<Row> rows = rows(networkId, BEGINNING, asOf);

        BigDecimal debits = rows.stream().map(Row::debit).reduce(Money.ZERO, BigDecimal::add);
        BigDecimal credits = rows.stream().map(Row::credit).reduce(Money.ZERO, BigDecimal::add);

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("asOf", asOf);
        report.put("rows", rows);
        report.put("totalDebit", debits);
        report.put("totalCredit", credits);
        report.put("balanced", debits.compareTo(credits) == 0);
        return report;
    }

    /** Income less expense over a period — the cooperative's surplus for the year to date. */
    public Map<String, Object> incomeStatement(Long networkId, LocalDate from, LocalDate to) {
        List<Row> rows = rows(networkId, from, to);
        List<Row> income = rows.stream().filter(row -> row.type() == AccountType.INCOME).toList();
        List<Row> expense = rows.stream().filter(row -> row.type() == AccountType.EXPENSE).toList();

        BigDecimal totalIncome = total(income);
        BigDecimal totalExpense = total(expense);

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("from", from);
        report.put("to", to);
        report.put("income", income);
        report.put("totalIncome", totalIncome);
        report.put("expenses", expense);
        report.put("totalExpense", totalExpense);
        report.put("surplus", totalIncome.subtract(totalExpense));
        return report;
    }

    /**
     * Assets against liabilities and equity. The surplus earned so far is folded into
     * equity, because it belongs to the members until it is distributed or reserved.
     */
    public Map<String, Object> balanceSheet(Long networkId, LocalDate asOf) {
        List<Row> rows = rows(networkId, BEGINNING, asOf);

        List<Row> assets = rows.stream().filter(row -> row.type() == AccountType.ASSET).toList();
        List<Row> liabilities = rows.stream().filter(row -> row.type() == AccountType.LIABILITY).toList();
        List<Row> equity = rows.stream().filter(row -> row.type() == AccountType.EQUITY).toList();

        BigDecimal surplus = total(rows.stream().filter(row -> row.type() == AccountType.INCOME).toList())
                .subtract(total(rows.stream().filter(row -> row.type() == AccountType.EXPENSE).toList()));

        BigDecimal totalAssets = total(assets);
        BigDecimal totalLiabilities = total(liabilities);
        BigDecimal totalEquity = total(equity).add(surplus);

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("asOf", asOf);
        report.put("assets", assets);
        report.put("totalAssets", totalAssets);
        report.put("liabilities", liabilities);
        report.put("totalLiabilities", totalLiabilities);
        report.put("equity", equity);
        report.put("currentSurplus", surplus);
        report.put("totalEquity", totalEquity);
        report.put("balanced", totalAssets.compareTo(totalLiabilities.add(totalEquity)) == 0);
        return report;
    }

    /**
     * Walks the hash chain from the first entry and reports the first break.
     *
     * <p>Two things are checked per entry: that its stored hash still matches its content,
     * and that it points at the hash of the entry before it. Editing any entry breaks the
     * first check; removing or re-ordering entries breaks the second.
     */
    public Map<String, Object> verifyChain(Long networkId) {
        List<JournalEntry> entries = entryRepo.findByNetworkIdOrderBySequenceNoAsc(networkId);

        String expectedPrevious = LedgerService.GENESIS_HASH;
        long expectedSequence = 1;

        for (JournalEntry entry : entries) {
            String problem = null;
            if (!expectedPrevious.equals(entry.getPreviousHash())) {
                problem = "Entry does not chain onto the previous one";
            } else if (entry.getSequenceNo() != expectedSequence) {
                problem = "Expected sequence " + expectedSequence + " but found " + entry.getSequenceNo();
            } else if (!LedgerService.hash(entry).equals(entry.getEntryHash())) {
                problem = "Stored hash does not match the entry's contents";
            }

            if (problem != null) {
                Map<String, Object> broken = new LinkedHashMap<>();
                broken.put("intact", false);
                broken.put("entriesChecked", expectedSequence - 1);
                broken.put("brokenAtSequence", entry.getSequenceNo());
                broken.put("brokenEntryId", entry.getId());
                broken.put("problem", problem);
                return broken;
            }

            expectedPrevious = entry.getEntryHash();
            expectedSequence++;
        }

        Map<String, Object> intact = new LinkedHashMap<>();
        intact.put("intact", true);
        intact.put("entriesChecked", entries.size());
        // Publishing this to members lets them check later that their cooperative's history
        // still ends where it ended today.
        intact.put("checkpointHash", expectedPrevious);
        return intact;
    }

    /** The member's savings balance as the journal implies it, ignoring the cached column. */
    public BigDecimal derivedSavingsBalance(Long memberId) {
        return Money.round(lineRepo.netMovementForMember(Accounts.MEMBER_SAVINGS, memberId).negate());
    }

    /**
     * Compares every member's cached balance against the ledger. A non-empty result means
     * the two records of the same money disagree, and should page somebody.
     */
    public Map<String, Object> balanceDrift(Long networkId, String sahakariName) {
        Map<Long, BigDecimal> derived = new LinkedHashMap<>();
        for (Object[] row : lineRepo.memberBalances(networkId, Accounts.MEMBER_SAVINGS)) {
            derived.put((Long) row[0], Money.round((BigDecimal) row[1]));
        }

        List<Map<String, Object>> drifted = new ArrayList<>();
        for (User member : userRepo.findBySahakari(sahakariName)) {
            BigDecimal cached = Money.round(member.getBalance());
            BigDecimal fromLedger = derived.getOrDefault(member.getId(), Money.ZERO);
            if (cached.compareTo(fromLedger) != 0) {
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("memberId", member.getId());
                entry.put("memberName", member.getName());
                entry.put("cachedBalance", cached);
                entry.put("ledgerBalance", fromLedger);
                entry.put("difference", cached.subtract(fromLedger));
                drifted.add(entry);
            }
        }

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("membersChecked", derived.size());
        report.put("driftCount", drifted.size());
        report.put("drifted", drifted);
        return report;
    }

    /**
     * Recognises the balances members already had before the ledger existed, so the
     * journal and the cached balance agree from the first day the books are used.
     *
     * <p>The other side is Opening Balance Equity rather than cash: the cooperative is
     * asserting that the obligation exists, not claiming the notes are in the drawer.
     * Idempotent — a member whose ledger balance already matches is skipped, so running it
     * twice does not double anyone's savings.
     */
    @Transactional
    public Map<String, Object> postOpeningBalances(Network network, String sahakariName,
                                                   LocalDate asOf, String postedBy) {
        Map<Long, BigDecimal> derived = new LinkedHashMap<>();
        for (Object[] row : lineRepo.memberBalances(network.getId(), Accounts.MEMBER_SAVINGS)) {
            derived.put((Long) row[0], Money.round((BigDecimal) row[1]));
        }

        int posted = 0;
        BigDecimal total = Money.ZERO;

        for (User member : userRepo.findBySahakari(sahakariName)) {
            BigDecimal shortfall = Money.round(member.getBalance())
                    .subtract(derived.getOrDefault(member.getId(), Money.ZERO));
            if (shortfall.signum() <= 0) continue;

            ledger.post(network, asOf,
                    "Opening savings balance for " + member.getName(),
                    null, "opening-balance", member.getId(), postedBy,
                    List.of(LedgerLine.debit(Accounts.OPENING_BALANCE_EQUITY, shortfall, "Balance carried in"),
                            LedgerLine.memberCredit(Accounts.MEMBER_SAVINGS, member, shortfall,
                                    "Balance carried in")));
            posted++;
            total = total.add(shortfall);
        }

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("asOf", asOf);
        report.put("entriesPosted", posted);
        report.put("totalRecognised", total);
        return report;
    }

    private List<Row> rows(Long networkId, LocalDate from, LocalDate to) {
        List<Row> rows = new ArrayList<>();
        for (Object[] raw : lineRepo.trialBalance(networkId, from, to)) {
            AccountType type = (AccountType) raw[2];
            BigDecimal debit = Money.round((BigDecimal) raw[3]);
            BigDecimal credit = Money.round((BigDecimal) raw[4]);
            BigDecimal balance = type.debitIncreases() ? debit.subtract(credit) : credit.subtract(debit);
            rows.add(new Row((String) raw[0], (String) raw[1], type, debit, credit, balance));
        }
        return rows;
    }

    private BigDecimal total(List<Row> rows) {
        return rows.stream().map(Row::balance).reduce(Money.ZERO, BigDecimal::add);
    }
}
