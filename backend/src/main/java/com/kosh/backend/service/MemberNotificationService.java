package com.kosh.backend.service;

import java.util.List;
import org.springframework.stereotype.Service;
import com.kosh.backend.model.Network;
import com.kosh.backend.model.LedgerCheckpoint;
import com.kosh.backend.model.Transaction;
import com.kosh.backend.model.User;

@Service
public class MemberNotificationService {
    private final List<MemberNotificationChannel> channels;
    public MemberNotificationService(List<MemberNotificationChannel> channels) { this.channels = List.copyOf(channels); }
    public void sendTransactionVoucher(User member, Transaction transaction, Network network) {
        channels.forEach(channel -> channel.sendTransactionVoucher(member, transaction, network));
    }
    public boolean sendLedgerCheckpoint(User member, LedgerCheckpoint checkpoint, Network network) {
        boolean delivered = false;
        for (MemberNotificationChannel channel : channels) {
            delivered = channel.sendLedgerCheckpoint(member, checkpoint, network) || delivered;
        }
        return delivered;
    }
}
