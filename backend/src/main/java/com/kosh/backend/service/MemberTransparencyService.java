package com.kosh.backend.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kosh.backend.ledger.Accounts;
import com.kosh.backend.model.JournalEntry;
import com.kosh.backend.model.JournalLine;
import com.kosh.backend.model.LedgerCheckpoint;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.JournalLineRepository;
import com.kosh.backend.repository.LedgerCheckpointRepository;
import com.kosh.backend.repository.UserRepository;

@Service
public class MemberTransparencyService {
    private final JournalLineRepository lines;
    private final LedgerCheckpointRepository checkpoints;
    private final UserRepository users;

    public MemberTransparencyService(JournalLineRepository lines, LedgerCheckpointRepository checkpoints,
            UserRepository users) {
        this.lines = lines; this.checkpoints = checkpoints; this.users = users;
    }

    @Transactional(readOnly = true)
    public Overview overview(Long networkId, Long memberId) {
        User member = users.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));
        if (!networkId.equals(member.getSahakariId())) throw new IllegalArgumentException("Member belongs to another cooperative");
        List<JournalLine> raw = lines.memberHistory(networkId, memberId);
        Map<String, BigDecimal> balances = new LinkedHashMap<>();
        List<HistoryLine> history = new ArrayList<>();
        for (JournalLine line : raw) {
            String code = line.getAccount().getCode();
            BigDecimal debit = Money.orZero(line.getDebit()); BigDecimal credit = Money.orZero(line.getCredit());
            BigDecimal change = line.getAccount().getType().debitIncreases()
                    ? debit.subtract(credit) : credit.subtract(debit);
            BigDecimal balance = Money.round(balances.getOrDefault(code, Money.ZERO).add(change));
            balances.put(code, balance);
            JournalEntry entry = line.getEntry();
            history.add(new HistoryLine(line.getId(), entry.getSequenceNo(), entry.getEntryDate(), entry.getPostedAt(),
                    entry.getVoucherRef(), entry.getNarration(), entry.getSourceType(), entry.getSourceId(),
                    code, line.getAccount().getName(), debit, credit, Money.round(change), balance, entry.getEntryHash()));
        }
        Collections.reverse(history);
        List<CheckpointView> published = checkpoints.findTop12ByNetworkIdOrderByCheckpointDateDesc(networkId)
                .stream().map(this::checkpoint).toList();
        return new Overview(member.getId(), member.getName(), balance(balances, Accounts.MEMBER_SAVINGS),
                balance(balances, Accounts.FIXED_DEPOSITS), balance(balances, Accounts.LOANS_RECEIVABLE),
                balance(balances, Accounts.SHARE_CAPITAL), history, published);
    }

    private BigDecimal balance(Map<String, BigDecimal> balances, String code) {
        return Money.round(balances.getOrDefault(code, Money.ZERO));
    }

    private CheckpointView checkpoint(LedgerCheckpoint value) {
        return new CheckpointView(value.getCheckpointDate(), value.getSequenceNo(), value.getEntryHash(),
                value.getPublishedAt(), value.getRecipientCount());
    }

    public record Overview(Long memberId, String memberName, BigDecimal savingsBalance,
            BigDecimal fixedDepositBalance, BigDecimal loanBalance, BigDecimal shareCapitalBalance,
            List<HistoryLine> history, List<CheckpointView> checkpoints) {}
    public record HistoryLine(Long lineId, Long sequenceNo, LocalDate date, Instant postedAt,
            String voucherRef, String narration, String sourceType, Long sourceId, String accountCode,
            String accountName, BigDecimal debit, BigDecimal credit, BigDecimal change,
            BigDecimal balanceAfter, String entryHash) {}
    public record CheckpointView(LocalDate checkpointDate, Long sequenceNo, String entryHash,
            Instant publishedAt, Integer recipientCount) {}
}
