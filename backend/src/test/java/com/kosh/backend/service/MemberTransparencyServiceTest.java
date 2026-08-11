package com.kosh.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.kosh.backend.model.Account;
import com.kosh.backend.model.AccountType;
import com.kosh.backend.model.JournalEntry;
import com.kosh.backend.model.JournalLine;
import com.kosh.backend.model.LedgerCheckpoint;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.JournalLineRepository;
import com.kosh.backend.repository.LedgerCheckpointRepository;
import com.kosh.backend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class MemberTransparencyServiceTest {
    @Mock JournalLineRepository lines;
    @Mock LedgerCheckpointRepository checkpoints;
    @Mock UserRepository users;

    @Test
    void derivesMemberBalanceAndHistoryFromJournalLines() {
        User member = new User(); member.setId(5L); member.setName("Sita"); member.setSahakariId(2L);
        when(users.findById(5L)).thenReturn(Optional.of(member));
        JournalLine deposit = line(11L, 1L, "2000", "Member Savings", AccountType.LIABILITY,
                "0.00", "1000.00", "b".repeat(64));
        JournalLine withdrawal = line(12L, 2L, "2000", "Member Savings", AccountType.LIABILITY,
                "250.00", "0.00", "c".repeat(64));
        when(lines.memberHistory(2L, 5L)).thenReturn(List.of(deposit, withdrawal));
        LedgerCheckpoint checkpoint = new LedgerCheckpoint(); checkpoint.setCheckpointDate(LocalDate.of(2026, 8, 10));
        checkpoint.setSequenceNo(2L); checkpoint.setEntryHash("c".repeat(64)); checkpoint.setRecipientCount(10);
        when(checkpoints.findTop12ByNetworkIdOrderByCheckpointDateDesc(2L)).thenReturn(List.of(checkpoint));
        MemberTransparencyService service = new MemberTransparencyService(lines, checkpoints, users);

        var result = service.overview(2L, 5L);

        assertThat(result.savingsBalance()).isEqualByComparingTo("750.00");
        assertThat(result.history()).extracting("sequenceNo").containsExactly(2L, 1L);
        assertThat(result.history().get(0).balanceAfter()).isEqualByComparingTo("750.00");
        assertThat(result.checkpoints().get(0).entryHash()).isEqualTo("c".repeat(64));
    }

    private JournalLine line(Long id, Long sequence, String code, String name, AccountType type,
            String debit, String credit, String hash) {
        Account account = new Account(); account.setCode(code); account.setName(name); account.setType(type);
        JournalEntry entry = new JournalEntry(); entry.setSequenceNo(sequence); entry.setEntryDate(LocalDate.of(2026, 8, sequence.intValue()));
        entry.setPostedAt(Instant.now()); entry.setNarration("Movement " + sequence); entry.setEntryHash(hash);
        JournalLine line = new JournalLine(); line.setId(id); line.setAccount(account); line.setEntry(entry);
        line.setDebit(new BigDecimal(debit)); line.setCredit(new BigDecimal(credit)); return line;
    }
}
