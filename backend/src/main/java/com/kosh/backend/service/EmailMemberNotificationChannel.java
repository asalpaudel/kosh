package com.kosh.backend.service;

import org.springframework.stereotype.Component;
import com.kosh.backend.model.Network;
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
}
