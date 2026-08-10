package com.kosh.backend.model;

/**
 * The five account classes of double-entry bookkeeping.
 *
 * <p>{@code debitIncreases} says which side of an entry raises the account's balance —
 * assets and expenses grow on the debit side, liabilities, equity and income on the credit
 * side. Everything the trial balance and the statements do follows from this flag.
 */
public enum AccountType {
    ASSET(true),
    LIABILITY(false),
    EQUITY(false),
    INCOME(false),
    EXPENSE(true);

    private final boolean debitIncreases;

    AccountType(boolean debitIncreases) {
        this.debitIncreases = debitIncreases;
    }

    public boolean debitIncreases() {
        return debitIncreases;
    }
}
