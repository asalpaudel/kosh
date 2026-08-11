package com.kosh.backend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kosh.backend.ledger.LedgerReports;
import com.kosh.backend.ledger.LedgerService;
import com.kosh.backend.model.JournalEntry;
import com.kosh.backend.model.LedgerCheckpoint;
import com.kosh.backend.model.Network;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.JournalEntryRepository;
import com.kosh.backend.repository.LedgerCheckpointRepository;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.repository.UserRepository;

@Service
public class CheckpointPublicationService {
    private final LedgerCheckpointRepository checkpoints;
    private final JournalEntryRepository entries;
    private final UserRepository users;
    private final NetworkRepository networks;
    private final LedgerReports reports;
    private final MemberNotificationService notifications;

    public CheckpointPublicationService(LedgerCheckpointRepository checkpoints, JournalEntryRepository entries,
            UserRepository users, NetworkRepository networks, LedgerReports reports,
            MemberNotificationService notifications) {
        this.checkpoints = checkpoints; this.entries = entries; this.users = users; this.networks = networks;
        this.reports = reports; this.notifications = notifications;
    }

    @Transactional
    public Publication publish(Network network, LocalDate date) {
        if (network == null || date == null) throw new IllegalArgumentException("Cooperative and checkpoint date are required");
        networks.lockForPosting(network.getId());
        var existing = checkpoints.findByNetworkIdAndCheckpointDate(network.getId(), date);
        if (existing.isPresent()) return new Publication(existing.get(), true);
        if (!Boolean.TRUE.equals(reports.verifyChain(network.getId()).get("intact"))) {
            throw new IllegalStateException("A broken journal chain cannot be published");
        }
        JournalEntry tip = entries.findFirstByNetworkIdOrderBySequenceNoDesc(network.getId()).orElse(null);
        LedgerCheckpoint checkpoint = new LedgerCheckpoint(); checkpoint.setNetwork(network);
        checkpoint.setCheckpointDate(date); checkpoint.setSequenceNo(tip == null ? 0L : tip.getSequenceNo());
        checkpoint.setEntryHash(tip == null ? LedgerService.GENESIS_HASH : tip.getEntryHash());
        checkpoint.setCreatedAt(Instant.now());
        List<User> recipients = users.findBySahakariIdAndRoleIgnoreCaseAndStatusIgnoreCaseOrderByNameAsc(
                network.getId(), "member", "Active").stream()
                .filter(member -> member.getEmail() != null && !member.getEmail().isBlank()).toList();
        int delivered = 0;
        for (User member : recipients) if (notifications.sendLedgerCheckpoint(member, checkpoint, network)) delivered++;
        checkpoint.setRecipientCount(delivered);
        if (delivered > 0) checkpoint.setPublishedAt(Instant.now());
        return new Publication(checkpoints.save(checkpoint), false);
    }

    public record Publication(LedgerCheckpoint checkpoint, boolean alreadyPublished) {}
}
