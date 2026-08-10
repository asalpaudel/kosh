package com.kosh.backend.ledger;

import java.math.BigDecimal;

import com.kosh.backend.model.User;
import com.kosh.backend.service.Money;

/**
 * One side of an entry, as callers describe it: an account code, an amount, and optionally
 * the member the amount belongs to.
 */
public record LedgerLine(String accountCode, User member, BigDecimal debit, BigDecimal credit, String memo) {

    public static LedgerLine debit(String accountCode, BigDecimal amount, String memo) {
        return new LedgerLine(accountCode, null, Money.round(amount), Money.ZERO, memo);
    }

    public static LedgerLine credit(String accountCode, BigDecimal amount, String memo) {
        return new LedgerLine(accountCode, null, Money.ZERO, Money.round(amount), memo);
    }

    public static LedgerLine memberDebit(String accountCode, User member, BigDecimal amount, String memo) {
        return new LedgerLine(accountCode, member, Money.round(amount), Money.ZERO, memo);
    }

    public static LedgerLine memberCredit(String accountCode, User member, BigDecimal amount, String memo) {
        return new LedgerLine(accountCode, member, Money.ZERO, Money.round(amount), memo);
    }

    /** The same amount on the opposite side, used to build reversing entries. */
    public LedgerLine mirrored() {
        return new LedgerLine(accountCode, member, credit, debit, memo);
    }
}
