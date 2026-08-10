package com.kosh.backend.ledger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.kosh.backend.model.Account;
import com.kosh.backend.model.AccountType;
import com.kosh.backend.model.JournalEntry;
import com.kosh.backend.model.JournalLine;
import com.kosh.backend.model.Network;
import com.kosh.backend.repository.JournalEntryRepository;
import com.kosh.backend.repository.JournalLineRepository;
import com.kosh.backend.repository.UserRepository;

class LedgerReportsTest {

    private final JournalLineRepository lineRepo = mock(JournalLineRepository.class);
    private final JournalEntryRepository entryRepo = mock(JournalEntryRepository.class);
    private final UserRepository userRepo = mock(UserRepository.class);
    private final LedgerService ledger = mock(LedgerService.class);

    private final LedgerReports reports = new LedgerReports(lineRepo, entryRepo, userRepo, ledger);

    @Test
    void trialBalanceReportsAccountBalancesOnTheirNormalSide() {
        when(lineRepo.trialBalance(any(), any(), any())).thenReturn(List.of(
                row("1000", "Cash in Hand", AccountType.ASSET, "5000.00", "1000.00"),
                row("2000", "Member Savings", AccountType.LIABILITY, "1000.00", "5000.00")));

        Map<String, Object> report = reports.trialBalance(1L, LocalDate.of(2026, 8, 10));

        @SuppressWarnings("unchecked")
        List<LedgerReports.Row> rows = (List<LedgerReports.Row>) report.get("rows");
        assertThat(rows.get(0).balance()).isEqualByComparingTo("4000.00");  // asset: debit heavy
        assertThat(rows.get(1).balance()).isEqualByComparingTo("4000.00");  // liability: credit heavy
        assertThat(report.get("balanced")).isEqualTo(true);
    }

    @Test
    void trialBalanceReportsWhenTheBooksDoNotBalance() {
        when(lineRepo.trialBalance(any(), any(), any())).thenReturn(List.of(
                row("1000", "Cash in Hand", AccountType.ASSET, "5000.00", "0.00"),
                row("2000", "Member Savings", AccountType.LIABILITY, "0.00", "4000.00")));

        assertThat(reports.trialBalance(1L, LocalDate.now()).get("balanced")).isEqualTo(false);
    }

    @Test
    void balanceSheetFoldsTheCurrentSurplusIntoEquityAndBalances() {
        when(lineRepo.trialBalance(any(), any(), any())).thenReturn(List.of(
                row("1000", "Cash in Hand", AccountType.ASSET, "10000.00", "0.00"),
                row("2000", "Member Savings", AccountType.LIABILITY, "0.00", "7000.00"),
                row("3000", "Share Capital", AccountType.EQUITY, "0.00", "2000.00"),
                row("4000", "Interest Income", AccountType.INCOME, "0.00", "1500.00"),
                row("5100", "Operating Expenses", AccountType.EXPENSE, "500.00", "0.00")));

        Map<String, Object> sheet = reports.balanceSheet(1L, LocalDate.now());

        assertThat(sheet.get("totalAssets")).isEqualTo(new BigDecimal("10000.00"));
        assertThat(sheet.get("currentSurplus")).isEqualTo(new BigDecimal("1000.00"));
        assertThat(sheet.get("totalEquity")).isEqualTo(new BigDecimal("3000.00"));
        assertThat(sheet.get("balanced")).isEqualTo(true);
    }

    @Test
    void anIntactChainVerifiesAndPublishesACheckpoint() {
        List<JournalEntry> chain = chainOf(3);
        when(entryRepo.findByNetworkIdOrderBySequenceNoAsc(1L)).thenReturn(chain);

        Map<String, Object> result = reports.verifyChain(1L);

        assertThat(result.get("intact")).isEqualTo(true);
        assertThat(result.get("entriesChecked")).isEqualTo(3);
        assertThat(result.get("checkpointHash")).isEqualTo(chain.get(2).getEntryHash());
    }

    @Test
    void anEditedEntryIsReportedAtItsOwnPositionInTheChain() {
        List<JournalEntry> chain = chainOf(3);
        chain.get(1).getLines().get(0).setDebit(new BigDecimal("9999.00"));
        when(entryRepo.findByNetworkIdOrderBySequenceNoAsc(1L)).thenReturn(chain);

        Map<String, Object> result = reports.verifyChain(1L);

        assertThat(result.get("intact")).isEqualTo(false);
        assertThat(result.get("brokenAtSequence")).isEqualTo(2L);
        assertThat(result.get("problem")).asString().contains("does not match");
    }

    @Test
    void aRemovedEntryBreaksTheLinkageOfTheOneAfterIt() {
        List<JournalEntry> chain = chainOf(3);
        chain.remove(1);
        when(entryRepo.findByNetworkIdOrderBySequenceNoAsc(1L)).thenReturn(chain);

        Map<String, Object> result = reports.verifyChain(1L);

        assertThat(result.get("intact")).isEqualTo(false);
        assertThat(result.get("brokenAtSequence")).isEqualTo(3L);
        assertThat(result.get("problem")).asString().contains("does not chain");
    }

    private List<JournalEntry> chainOf(int length) {
        Network network = new Network();
        network.setId(1L);

        List<JournalEntry> chain = new java.util.ArrayList<>();
        String previous = LedgerService.GENESIS_HASH;

        for (int i = 1; i <= length; i++) {
            JournalEntry entry = new JournalEntry();
            entry.setId((long) i);
            entry.setNetwork(network);
            entry.setSequenceNo((long) i);
            entry.setEntryDate(LocalDate.of(2026, 8, i));
            entry.setNarration("Entry " + i);
            entry.setPreviousHash(previous);
            entry.addLine(line("1000", new BigDecimal("100.00"), BigDecimal.ZERO));
            entry.addLine(line("2000", BigDecimal.ZERO, new BigDecimal("100.00")));
            entry.setEntryHash(LedgerService.hash(entry));
            previous = entry.getEntryHash();
            chain.add(entry);
        }
        return chain;
    }

    private JournalLine line(String code, BigDecimal debit, BigDecimal credit) {
        Account account = new Account();
        account.setCode(code);
        account.setName(code);
        account.setType(AccountType.ASSET);

        JournalLine line = new JournalLine();
        line.setAccount(account);
        line.setDebit(debit);
        line.setCredit(credit);
        return line;
    }

    private Object[] row(String code, String name, AccountType type, String debit, String credit) {
        return new Object[]{code, name, type, new BigDecimal(debit), new BigDecimal(credit)};
    }
}
