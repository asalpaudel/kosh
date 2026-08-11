package com.kosh.backend.service;

import org.springframework.stereotype.Component;
import com.kosh.backend.model.Network;
import com.kosh.backend.model.LedgerCheckpoint;
import com.kosh.backend.model.Transaction;
import com.kosh.backend.model.User;

@Component
public class EmailMemberNotificationChannel implements MemberNotificationChannel {
    private final EmailService email;
    public EmailMemberNotificationChannel(EmailService email) { this.email = email; }
    @Override public void sendTransactionVoucher(User member, Transaction transaction, Network network) {
        if (member.getEmail() != null && !member.getEmail().isBlank()) {
            email.sendTransactionVoucherEmail(member.getEmail(), transaction, network);
        }
    }
    @Override public boolean sendLedgerCheckpoint(User member, LedgerCheckpoint checkpoint, Network network) {
        if (member.getEmail() == null || member.getEmail().isBlank()) return false;
        return email.sendNotificationEmail(member.getEmail(), network.getName() + " ledger checkpoint",
                "Keep this message as your independent ledger receipt.\n\n"
                + "Cooperative: " + network.getName() + "\n"
                + "Checkpoint date: " + checkpoint.getCheckpointDate() + "\n"
                + "Journal sequence: " + checkpoint.getSequenceNo() + "\n"
                + "SHA-256 checkpoint: " + checkpoint.getEntryHash() + "\n\n"
                + "If a future checkpoint no longer chains through this value, ask your cooperative auditor to investigate.");
    }
}
