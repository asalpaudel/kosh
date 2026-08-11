package com.kosh.backend.ledger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.kosh.backend.model.Account;
import com.kosh.backend.model.AccountType;
import com.kosh.backend.model.JournalEntry;
import com.kosh.backend.model.Network;
import com.kosh.backend.repository.AccountRepository;
import com.kosh.backend.repository.AccountingPeriodRepository;
import com.kosh.backend.repository.JournalEntryRepository;
import com.kosh.backend.repository.NetworkRepository;

class LedgerServiceTest {

    private final AccountRepository accountRepo = mock(AccountRepository.class);
    private final JournalEntryRepository entryRepo = mock(JournalEntryRepository.class);
    private final NetworkRepository networkRepo = mock(NetworkRepository.class);
    private final AccountingPeriodRepository periodRepo = mock(AccountingPeriodRepository.class);

    private final LedgerService ledger = new LedgerService(accountRepo, entryRepo, networkRepo, periodRepo);

    private final Network network = new Network();

    @BeforeEach
    void setUp() {
        network.setId(1L);
        when(accountRepo.existsByNetworkId(1L)).thenReturn(true);
        when(accountRepo.findByNetworkIdAndCode(any(), any())).thenAnswer(invocation ->
                Optional.of(account(invocation.getArgument(1))));
        when(entryRepo.save(any(JournalEntry.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void unbalancedEntryIsRefusedBeforeAnythingIsWritten() {
        assertThatThrownBy(() -> post(List.of(
                LedgerLine.debit(Accounts.CASH, amount("500.00"), "in"),
                LedgerLine.credit(Accounts.MEMBER_SAVINGS, amount("400.00"), "out"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("does not balance");

        verify(entryRepo, never()).save(any());
    }

    @Test
    void singleSidedEntryIsRefused() {
        assertThatThrownBy(() -> post(List.of(
                LedgerLine.debit(Accounts.CASH, amount("500.00"), "in"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("at least two lines");

        verify(entryRepo, never()).save(any());
    }

    @Test
    void negativeAmountIsRefused() {
        assertThatThrownBy(() -> post(List.of(
                LedgerLine.debit(Accounts.CASH, amount("-500.00"), "in"),
                LedgerLine.credit(Accounts.MEMBER_SAVINGS, amount("-500.00"), "out"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("negative");
    }

    @Test
    void postingInsideClosedPeriodIsRejectedBeforeLedgerWrite() {
        when(periodRepo.isDateClosed(1L, LocalDate.of(2026, 8, 10))).thenReturn(true);

        assertThatThrownBy(() -> ledger.post(network, LocalDate.of(2026, 8, 10), "deposit", "V-1",
                "TEST", 1L, "Admin", balancedDeposit()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("closed accounting period");
        verify(entryRepo, never()).save(any());
    }

    @Test
    void firstEntryChainsFromGenesisAndNumbersFromOne() {
        when(entryRepo.findFirstByNetworkIdOrderBySequenceNoDesc(1L)).thenReturn(Optional.empty());

        JournalEntry entry = post(balancedDeposit());

        assertThat(entry.getSequenceNo()).isEqualTo(1L);
        assertThat(entry.getPreviousHash()).isEqualTo(LedgerService.GENESIS_HASH);
        assertThat(entry.getEntryHash()).hasSize(64).matches("[0-9a-f]{64}");
    }

    @Test
    void eachEntryChainsOntoTheHashOfTheOneBefore() {
        JournalEntry previous = new JournalEntry();
        previous.setSequenceNo(41L);
        previous.setEntryHash("a".repeat(64));
        when(entryRepo.findFirstByNetworkIdOrderBySequenceNoDesc(1L)).thenReturn(Optional.of(previous));

        JournalEntry entry = post(balancedDeposit());

        assertThat(entry.getSequenceNo()).isEqualTo(42L);
        assertThat(entry.getPreviousHash()).isEqualTo("a".repeat(64));
    }

    @Test
    void changingAPostedAmountBreaksItsHash() {
        when(entryRepo.findFirstByNetworkIdOrderBySequenceNoDesc(1L)).thenReturn(Optional.empty());
        JournalEntry entry = post(balancedDeposit());
        String original = entry.getEntryHash();

        entry.getLines().get(0).setDebit(amount("9999.00"));

        assertThat(LedgerService.hash(entry)).isNotEqualTo(original);
    }

    @Test
    void identicalContentInADifferentChainPositionHashesDifferently() {
        when(entryRepo.findFirstByNetworkIdOrderBySequenceNoDesc(1L)).thenReturn(Optional.empty());
        JournalEntry first = post(balancedDeposit());

        JournalEntry previous = new JournalEntry();
        previous.setSequenceNo(1L);
        previous.setEntryHash(first.getEntryHash());
        when(entryRepo.findFirstByNetworkIdOrderBySequenceNoDesc(1L)).thenReturn(Optional.of(previous));

        JournalEntry second = post(balancedDeposit());

        assertThat(second.getEntryHash()).isNotEqualTo(first.getEntryHash());
    }

    @Test
    void reversalMirrorsEveryLineAndPointsBackAtTheOriginal() {
        when(entryRepo.findFirstByNetworkIdOrderBySequenceNoDesc(1L)).thenReturn(Optional.empty());
        JournalEntry original = post(balancedDeposit());
        original.setId(7L);
        when(entryRepo.existsByReversesEntryId(7L)).thenReturn(false);

        JournalEntry reversal = ledger.reverse(original, "Posted twice", "admin");

        assertThat(reversal.getReversesEntry()).isSameAs(original);
        assertThat(reversal.getLines()).hasSameSizeAs(original.getLines());
        for (int i = 0; i < original.getLines().size(); i++) {
            assertThat(reversal.getLines().get(i).getDebit())
                    .isEqualByComparingTo(original.getLines().get(i).getCredit());
            assertThat(reversal.getLines().get(i).getCredit())
                    .isEqualByComparingTo(original.getLines().get(i).getDebit());
        }
    }

    @Test
    void anEntryCannotBeReversedTwice() {
        when(entryRepo.findFirstByNetworkIdOrderBySequenceNoDesc(1L)).thenReturn(Optional.empty());
        JournalEntry original = post(balancedDeposit());
        original.setId(7L);
        when(entryRepo.existsByReversesEntryId(7L)).thenReturn(true);

        assertThatThrownBy(() -> ledger.reverse(original, "again", "admin"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already been reversed");
    }

    private List<LedgerLine> balancedDeposit() {
        return List.of(
                LedgerLine.debit(Accounts.CASH, amount("1500.00"), "Cash received"),
                LedgerLine.credit(Accounts.MEMBER_SAVINGS, amount("1500.00"), "Member savings"));
    }

    private JournalEntry post(List<LedgerLine> lines) {
        return ledger.post(network, LocalDate.of(2026, 8, 10), "Member deposit",
                "V-1", "transaction", 55L, "admin", lines);
    }

    private Account account(String code) {
        Account account = new Account();
        account.setId(1L);
        account.setNetwork(network);
        account.setCode(code);
        account.setName(code);
        account.setType(AccountType.ASSET);
        return account;
    }

    private static BigDecimal amount(String value) {
        return new BigDecimal(value);
    }
}
