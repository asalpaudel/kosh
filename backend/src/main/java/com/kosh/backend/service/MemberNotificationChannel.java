package com.kosh.backend.service;

import com.kosh.backend.model.Network;
import com.kosh.backend.model.LedgerCheckpoint;
import com.kosh.backend.model.Transaction;
import com.kosh.backend.model.User;

public interface MemberNotificationChannel {
    void sendTransactionVoucher(User member, Transaction transaction, Network network);
    boolean sendLedgerCheckpoint(User member, LedgerCheckpoint checkpoint, Network network);
}
