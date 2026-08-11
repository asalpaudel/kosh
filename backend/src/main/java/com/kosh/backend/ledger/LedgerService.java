package com.kosh.backend.ledger;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.kosh.backend.model.Account;
import com.kosh.backend.model.JournalEntry;
import com.kosh.backend.model.JournalLine;
import com.kosh.backend.model.Network;
import com.kosh.backend.repository.AccountRepository;
import com.kosh.backend.repository.AccountingPeriodRepository;
import com.kosh.backend.repository.JournalEntryRepository;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.service.Money;

/**
 * The only way money is recorded.
 *
 * <p>Every posting is a balanced set of debits and credits written in one transaction, and
 * every entry is chained to the previous one by hash. Nothing here updates or deletes a
 * posted entry — the database would refuse anyway. A mistake is corrected with
 * {@link #reverse}, which writes a mirrored entry pointing back at the original.
 */
@Service
public class LedgerService {

    private static final ZoneId NEPAL_TIME = ZoneId.of("Asia/Kathmandu");

    /** Seed of a cooperative's chain: the "previous hash" of its first entry. */
    public static final String GENESIS_HASH = "0".repeat(64);

    private final AccountRepository accountRepo;
    private final JournalEntryRepository entryRepo;
    private final NetworkRepository networkRepo;
    private final AccountingPeriodRepository periodRepo;

    public LedgerService(AccountRepository accountRepo,
                         JournalEntryRepository entryRepo,
                         NetworkRepository networkRepo,
                         AccountingPeriodRepository periodRepo) {
        this.accountRepo = accountRepo;
        this.entryRepo = entryRepo;
        this.networkRepo = networkRepo;
        this.periodRepo = periodRepo;
    }

    /**
     * Posts one balanced entry. Must run inside the caller's transaction so the ledger
     * write and whatever it records either both land or neither does.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public JournalEntry post(Network network,
                             LocalDate entryDate,
                             String narration,
                             String voucherRef,
                             String sourceType,
                             Long sourceId,
                             String postedBy,
                             List<LedgerLine> lines) {
        return write(network, entryDate, narration, voucherRef, sourceType, sourceId, postedBy, lines, null);
    }

    /**
     * Reverses a posted entry by writing its mirror image. The original stays exactly as
     * it was; the correction is visible as its own entry, which is what an auditor expects.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public JournalEntry reverse(JournalEntry original, String reason, String postedBy) {
        if (entryRepo.existsByReversesEntryId(original.getId())) {
            throw new IllegalStateException("Entry " + original.getId() + " has already been reversed");
        }

        List<LedgerLine> mirrored = original.getLines().stream()
                .map(line -> new LedgerLine(line.getAccount().getCode(), line.getMember(),
                        line.getCredit(), line.getDebit(), line.getLineMemo()))
                .toList();

        return write(original.getNetwork(), LocalDate.now(NEPAL_TIME),
                reason != null ? reason : "Reversal of entry #" + original.getSequenceNo(),
                original.getVoucherRef(), original.getSourceType(), original.getSourceId(),
                postedBy, mirrored, original);
    }

    private JournalEntry write(Network network,
                               LocalDate entryDate,
                               String narration,
                               String voucherRef,
                               String sourceType,
                               Long sourceId,
                               String postedBy,
                               List<LedgerLine> lines,
                               JournalEntry reverses) {
        if (lines == null || lines.size() < 2) {
            throw new IllegalArgumentException("A journal entry needs at least two lines");
        }
        requireBalanced(lines);
        LocalDate effectiveDate = entryDate != null ? entryDate : LocalDate.now(NEPAL_TIME);
        if (periodRepo.isDateClosed(network.getId(), effectiveDate)) {
            throw new IllegalStateException("Posting date " + effectiveDate
                    + " is inside a closed accounting period; an authorised reopen is required");
        }
        ensureChartOfAccounts(network);

        // Serialise posting per cooperative: the sequence number and the previous hash are
        // read-then-written, so two concurrent posts would otherwise chain off the same tip.
        networkRepo.lockForPosting(network.getId());

        Optional<JournalEntry> tip = entryRepo.findFirstByNetworkIdOrderBySequenceNoDesc(network.getId());
        long sequenceNo = tip.map(JournalEntry::getSequenceNo).orElse(0L) + 1;
        String previousHash = tip.map(JournalEntry::getEntryHash).orElse(GENESIS_HASH);

        JournalEntry entry = new JournalEntry();
        entry.setNetwork(network);
        entry.setSequenceNo(sequenceNo);
        entry.setEntryDate(effectiveDate);
        entry.setNarration(narration);
        entry.setVoucherRef(voucherRef);
        entry.setSourceType(sourceType);
        entry.setSourceId(sourceId);
        entry.setPostedAt(Instant.now());
        entry.setPostedBy(postedBy);
        entry.setReversesEntry(reverses);
        entry.setPreviousHash(previousHash);

        for (LedgerLine line : lines) {
            Account account = accountRepo.findByNetworkIdAndCode(network.getId(), line.accountCode())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Unknown account code " + line.accountCode() + " for cooperative " + network.getId()));

            JournalLine journalLine = new JournalLine();
            journalLine.setAccount(account);
            journalLine.setMember(line.member());
            journalLine.setDebit(Money.orZero(line.debit()));
            journalLine.setCredit(Money.orZero(line.credit()));
            journalLine.setLineMemo(line.memo());
            entry.addLine(journalLine);
        }

        entry.setEntryHash(hash(entry));
        return entryRepo.save(entry);
    }

    private void requireBalanced(List<LedgerLine> lines) {
        BigDecimal debits = Money.ZERO;
        BigDecimal credits = Money.ZERO;
        for (LedgerLine line : lines) {
            BigDecimal debit = Money.orZero(line.debit());
            BigDecimal credit = Money.orZero(line.credit());
            if (debit.signum() < 0 || credit.signum() < 0) {
                throw new IllegalArgumentException("Journal amounts cannot be negative");
            }
            if (debit.signum() == 0 && credit.signum() == 0) {
                throw new IllegalArgumentException("A journal line must carry an amount");
            }
            if (debit.signum() != 0 && credit.signum() != 0) {
                throw new IllegalArgumentException("A journal line is either a debit or a credit, not both");
            }
            debits = debits.add(debit);
            credits = credits.add(credit);
        }
        if (debits.compareTo(credits) != 0) {
            throw new IllegalArgumentException("Entry does not balance: debit " + debits + " vs credit " + credits);
        }
    }

    /**
     * Makes sure the cooperative has every account the posting code relies on. Adds only
     * what is missing, so cooperatives created before an account was introduced pick it up
     * and any account a cooperative added itself is left alone.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void ensureChartOfAccounts(Network network) {
        List<Account> missing = new ArrayList<>();
        for (Accounts.Definition definition : Accounts.defaults()) {
            if (accountRepo.findByNetworkIdAndCode(network.getId(), definition.code()).isPresent()) continue;

            Account account = new Account();
            account.setNetwork(network);
            account.setCode(definition.code());
            account.setName(definition.name());
            account.setType(definition.type());
            missing.add(account);
        }
        if (!missing.isEmpty()) {
            accountRepo.saveAll(missing);
        }
    }

    /**
     * The content that a stored hash commits to. Any later edit to an entry or one of its
     * lines changes this string, so the recomputed hash stops matching.
     */
    static String canonicalForm(JournalEntry entry) {
        StringBuilder canonical = new StringBuilder()
                .append(entry.getNetwork().getId()).append('|')
                .append(entry.getSequenceNo()).append('|')
                .append(entry.getEntryDate()).append('|')
                .append(entry.getNarration()).append('|')
                .append(nullSafe(entry.getVoucherRef())).append('|')
                .append(nullSafe(entry.getSourceType())).append('|')
                .append(nullSafe(entry.getSourceId())).append('|')
                .append(entry.getReversesEntry() != null ? entry.getReversesEntry().getId() : "").append('|');

        entry.getLines().stream()
                .map(line -> line.getAccount().getCode() + ':'
                        + (line.getMember() != null ? line.getMember().getId() : "") + ':'
                        + Money.orZero(line.getDebit()).toPlainString() + ':'
                        + Money.orZero(line.getCredit()).toPlainString())
                .sorted()
                .forEach(line -> canonical.append(line).append(';'));

        return canonical.append('|').append(entry.getPreviousHash()).toString();
    }

    static String hash(JournalEntry entry) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(canonicalForm(entry).getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                hex.append(Character.forDigit((b >> 4) & 0xF, 16)).append(Character.forDigit(b & 0xF, 16));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is required to post to the ledger", e);
        }
    }

    private static String nullSafe(Object value) {
        return value == null ? "" : value.toString();
    }
}
