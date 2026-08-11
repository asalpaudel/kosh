package com.kosh.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.kosh.backend.ledger.LedgerReports;
import com.kosh.backend.model.JournalEntry;
import com.kosh.backend.model.LedgerCheckpoint;
import com.kosh.backend.model.Network;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.JournalEntryRepository;
import com.kosh.backend.repository.LedgerCheckpointRepository;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class CheckpointPublicationServiceTest {
    @Mock LedgerCheckpointRepository checkpoints;
    @Mock JournalEntryRepository entries;
    @Mock UserRepository users;
    @Mock NetworkRepository networks;
    @Mock LedgerReports reports;
    @Mock MemberNotificationService notifications;

    @Test
    void publishesJournalTipToMemberEmailAndDoesNotRepublishDate() {
        Network network = new Network(); network.setId(4L); network.setName("Member Owned");
        User member = new User(); member.setId(8L); member.setEmail("member@example.test");
        JournalEntry tip = new JournalEntry(); tip.setSequenceNo(29L); tip.setEntryHash("a".repeat(64));
        LocalDate date = LocalDate.of(2026, 8, 10);
        when(checkpoints.findByNetworkIdAndCheckpointDate(4L, date)).thenReturn(Optional.empty());
        when(reports.verifyChain(4L)).thenReturn(Map.of("intact", true));
        when(entries.findFirstByNetworkIdOrderBySequenceNoDesc(4L)).thenReturn(Optional.of(tip));
        when(users.findBySahakariIdAndRoleIgnoreCaseAndStatusIgnoreCaseOrderByNameAsc(4L, "member", "Active"))
                .thenReturn(List.of(member));
        when(checkpoints.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(notifications.sendLedgerCheckpoint(any(), any(), any())).thenReturn(true);
        CheckpointPublicationService service = new CheckpointPublicationService(checkpoints, entries, users,
                networks, reports, notifications);

        var first = service.publish(network, date);
        when(checkpoints.findByNetworkIdAndCheckpointDate(4L, date)).thenReturn(Optional.of(first.checkpoint()));
        var replay = service.publish(network, date);

        assertThat(first.alreadyPublished()).isFalse();
        assertThat(first.checkpoint().getSequenceNo()).isEqualTo(29L);
        assertThat(first.checkpoint().getEntryHash()).isEqualTo("a".repeat(64));
        assertThat(first.checkpoint().getRecipientCount()).isEqualTo(1);
        assertThat(replay.alreadyPublished()).isTrue();
        verify(notifications).sendLedgerCheckpoint(member, first.checkpoint(), network);
    }
}
