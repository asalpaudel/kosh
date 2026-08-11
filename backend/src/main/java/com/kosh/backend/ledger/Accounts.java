package com.kosh.backend.ledger;

import java.util.List;

import com.kosh.backend.model.AccountType;

/**
 * The default chart of accounts every cooperative starts with.
 *
 * <p>Codes are stable identifiers used from posting code, so they must not be renumbered.
 * Names are display text and may be edited by a cooperative; new accounts can be added
 * alongside these without touching this file.
 */
public final class Accounts {

    // Assets — what the cooperative holds or is owed.
    public static final String CASH = "1000";
    public static final String BANK = "1010";
    public static final String LOANS_RECEIVABLE = "1100";

    // Liabilities — members' money the cooperative holds.
    public static final String MEMBER_SAVINGS = "2000";
    public static final String FIXED_DEPOSITS = "2100";

    // Equity.
    public static final String SHARE_CAPITAL = "3000";
    public static final String RESERVE_FUND = "3100";
    /** Where balances carried in from before the ledger existed are recognised. */
    public static final String OPENING_BALANCE_EQUITY = "3800";
    public static final String RETAINED_EARNINGS = "3900";

    // Income and expense.
    public static final String INTEREST_INCOME = "4000";
    public static final String FEE_INCOME = "4100";
    public static final String INTEREST_EXPENSE = "5000";
    public static final String LOAN_LOSS_PROVISION = "1190";
    public static final String PROVISION_EXPENSE = "5200";
    public static final String OPERATING_EXPENSE = "5100";

    public record Definition(String code, String name, AccountType type) {
    }

    private static final List<Definition> DEFAULTS = List.of(
            new Definition(CASH, "Cash in Hand", AccountType.ASSET),
            new Definition(BANK, "Bank Accounts", AccountType.ASSET),
            new Definition(LOANS_RECEIVABLE, "Loans to Members", AccountType.ASSET),
            new Definition(MEMBER_SAVINGS, "Member Savings", AccountType.LIABILITY),
            new Definition(FIXED_DEPOSITS, "Member Fixed Deposits", AccountType.LIABILITY),
            new Definition(SHARE_CAPITAL, "Share Capital", AccountType.EQUITY),
            new Definition(RESERVE_FUND, "Statutory Reserve Fund", AccountType.EQUITY),
            new Definition(OPENING_BALANCE_EQUITY, "Opening Balance Equity", AccountType.EQUITY),
            new Definition(RETAINED_EARNINGS, "Retained Earnings", AccountType.EQUITY),
            new Definition(INTEREST_INCOME, "Interest Income on Loans", AccountType.INCOME),
            new Definition(FEE_INCOME, "Fees and Charges", AccountType.INCOME),
            new Definition(INTEREST_EXPENSE, "Interest Expense", AccountType.EXPENSE),
            new Definition(LOAN_LOSS_PROVISION, "Loan Loss Provision", AccountType.ASSET),
            new Definition(PROVISION_EXPENSE, "Provision Expense", AccountType.EXPENSE),
            new Definition(OPERATING_EXPENSE, "Operating Expenses", AccountType.EXPENSE));

    private Accounts() {
    }

    public static List<Definition> defaults() {
        return DEFAULTS;
    }
}
