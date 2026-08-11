package com.kosh.backend.ledger;

import java.math.BigDecimal;
import java.util.List;

import com.kosh.backend.model.User;

/**
 * Translates the operational vocabulary of a posted transaction — account head, direction,
 * payment method — into the debits and credits that record it.
 *
 * <p>Kept as a pure function so the mapping can be read and tested on its own. It refuses
 * anything it does not recognise: a mis-posted entry is far more expensive to unpick later
 * than a rejected request is now.
 */
public final class LedgerPostings {

    public static final String SAVINGS = "Savings";
    public static final String FIXED_DEPOSIT = "Fixed Deposit";
    public static final String LOAN = "Loan";

    private LedgerPostings() {
    }

    /**
     * @param mode          "member" for a member's own position, "network" for the cooperative's own books
     * @param accountHead   "Savings", "Fixed Deposit", "Loan", or "Income: …" / "Expense: …" in network mode
     * @param direction     "Credit" or "Debit", read against the head as the tellers use it
     * @param paymentMethod how the member paid, which decides cash versus bank
     * @param networkLedger "Cash" or "Bank" for network-mode entries
     */
    public static List<LedgerLine> forTransaction(String mode,
                                                  String accountHead,
                                                  String direction,
                                                  String paymentMethod,
                                                  String networkLedger,
                                                  BigDecimal amount,
                                                  User member,
                                                  String memo) {
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("A transaction must carry a positive amount");
        }
        boolean credit = "Credit".equalsIgnoreCase(direction);
        if (!credit && !"Debit".equalsIgnoreCase(direction)) {
            throw new IllegalArgumentException("Unknown transaction direction: " + direction);
        }

        if ("network".equalsIgnoreCase(mode)) {
            return networkLines(accountHead, credit, networkLedger, amount, memo);
        }
        return memberLines(accountHead, credit, paymentMethod, amount, member, memo);
    }

    private static List<LedgerLine> memberLines(String accountHead,
                                                boolean credit,
                                                String paymentMethod,
                                                BigDecimal amount,
                                                User member,
                                                String memo) {
        if (member == null) {
            throw new IllegalArgumentException("A member transaction must name the member");
        }
        String settlement = settlementAccount(paymentMethod);

        return switch (accountHead == null ? "" : accountHead) {
            // Savings: a credit is money in, so the cooperative owes the member more.
            case SAVINGS -> credit
                    ? List.of(LedgerLine.debit(settlement, amount, memo),
                              LedgerLine.memberCredit(Accounts.MEMBER_SAVINGS, member, amount, memo))
                    : List.of(LedgerLine.memberDebit(Accounts.MEMBER_SAVINGS, member, amount, memo),
                              LedgerLine.credit(settlement, amount, memo));

            case FIXED_DEPOSIT -> credit
                    ? List.of(LedgerLine.debit(settlement, amount, memo),
                              LedgerLine.memberCredit(Accounts.FIXED_DEPOSITS, member, amount, memo))
                    : List.of(LedgerLine.memberDebit(Accounts.FIXED_DEPOSITS, member, amount, memo),
                              LedgerLine.credit(settlement, amount, memo));

            // Loans invert: a debit is a disbursement, which grows the amount owed to the
            // cooperative; a credit is a repayment, which shrinks it.
            case LOAN -> credit
                    ? List.of(LedgerLine.debit(settlement, amount, memo),
                              LedgerLine.memberCredit(Accounts.LOANS_RECEIVABLE, member, amount, memo))
                    : List.of(LedgerLine.memberDebit(Accounts.LOANS_RECEIVABLE, member, amount, memo),
                              LedgerLine.credit(settlement, amount, memo));

            default -> throw new IllegalArgumentException("Unknown member account head: " + accountHead);
        };
    }

    private static List<LedgerLine> networkLines(String accountHead,
                                                 boolean credit,
                                                 String networkLedger,
                                                 BigDecimal amount,
                                                 String memo) {
        String settlement = "Bank".equalsIgnoreCase(networkLedger) ? Accounts.BANK : Accounts.CASH;
        String head = accountHead == null ? "" : accountHead;

        if (credit) {
            if (!head.startsWith("Income")) {
                throw new IllegalArgumentException("A credit to the cooperative's own books must be income: " + head);
            }
            return List.of(LedgerLine.debit(settlement, amount, memo),
                           LedgerLine.credit(Accounts.FEE_INCOME, amount, head));
        }

        if (!head.startsWith("Expense")) {
            throw new IllegalArgumentException("A debit to the cooperative's own books must be an expense: " + head);
        }
        return List.of(LedgerLine.debit(Accounts.OPERATING_EXPENSE, amount, head),
                       LedgerLine.credit(settlement, amount, memo));
    }

    /** Cheques and transfers move through the bank; everything else is treated as cash. */
    private static String settlementAccount(String paymentMethod) {
        if (paymentMethod == null) return Accounts.CASH;
        return switch (paymentMethod.toLowerCase()) {
            case "cheque", "transfer", "bank" -> Accounts.BANK;
            default -> Accounts.CASH;
        };
    }

    /**
     * A loan repayment, split the way the schedule allocates it.
     *
     * <p>The interest share is income the cooperative has earned; only the principal share
     * reduces what the member owes. Anything beyond the outstanding schedule is treated as
     * an overpayment and parked in the member's savings rather than silently absorbed.
     */
    public static List<LedgerLine> loanRepayment(User member,
                                                 BigDecimal principal,
                                                 BigDecimal interest,
                                                 BigDecimal overpayment,
                                                 String paymentMethod,
                                                 String memo) {
        if (member == null) {
            throw new IllegalArgumentException("A member transaction must name the member");
        }
        BigDecimal received = principal.add(interest).add(overpayment);
        if (received.signum() <= 0) {
            throw new IllegalArgumentException("A repayment must be a positive amount");
        }

        List<LedgerLine> lines = new java.util.ArrayList<>();
        lines.add(LedgerLine.debit(settlementAccount(paymentMethod), received, memo));
        if (principal.signum() > 0) {
            lines.add(LedgerLine.memberCredit(Accounts.LOANS_RECEIVABLE, member, principal, "Principal"));
        }
        if (interest.signum() > 0) {
            lines.add(LedgerLine.credit(Accounts.INTEREST_INCOME, interest, "Interest on loan"));
        }
        if (overpayment.signum() > 0) {
            lines.add(LedgerLine.memberCredit(Accounts.MEMBER_SAVINGS, member, overpayment,
                    "Repayment in excess of the schedule"));
        }
        return lines;
    }

    /** Savings moved into a fixed deposit: the cooperative owes the same money under a different head. */
    public static List<LedgerLine> savingsToFixedDeposit(User member, BigDecimal amount, String memo) {
        return List.of(LedgerLine.memberDebit(Accounts.MEMBER_SAVINGS, member, amount, memo),
                       LedgerLine.memberCredit(Accounts.FIXED_DEPOSITS, member, amount, memo));
    }

    /** Loan disbursed into the member's savings rather than paid out over the counter. */
    public static List<LedgerLine> loanDisbursedToSavings(User member, BigDecimal amount, String memo) {
        return List.of(LedgerLine.memberDebit(Accounts.LOANS_RECEIVABLE, member, amount, memo),
                       LedgerLine.memberCredit(Accounts.MEMBER_SAVINGS, member, amount, memo));
    }

    public static List<LedgerLine> sharePurchase(User member, BigDecimal amount,
                                                  String paymentMethod, String memo) {
        if (member == null || amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("A share purchase needs a member and positive amount");
        }
        return List.of(LedgerLine.debit(settlementAccount(paymentMethod), amount, memo),
                LedgerLine.memberCredit(Accounts.SHARE_CAPITAL, member, amount, memo));
    }

    public static List<LedgerLine> shareTransfer(User from, User to, BigDecimal amount, String memo) {
        if (from == null || to == null || from.getId().equals(to.getId())
                || amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("A share transfer needs two different members and positive amount");
        }
        return List.of(LedgerLine.memberDebit(Accounts.SHARE_CAPITAL, from, amount, memo),
                LedgerLine.memberCredit(Accounts.SHARE_CAPITAL, to, amount, memo));
    }

    public static List<LedgerLine> shareRefund(User member, BigDecimal amount,
                                                String paymentMethod, String memo) {
        if (member == null || amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("A share refund needs a member and positive amount");
        }
        return List.of(LedgerLine.memberDebit(Accounts.SHARE_CAPITAL, member, amount, memo),
                LedgerLine.credit(settlementAccount(paymentMethod), amount, memo));
    }

    public static List<LedgerLine> savingsInterest(User member, BigDecimal amount, String memo) {
        if (member == null || amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("Savings interest needs a member and positive amount");
        }
        return List.of(LedgerLine.debit(Accounts.INTEREST_EXPENSE, amount, memo),
                LedgerLine.memberCredit(Accounts.MEMBER_SAVINGS, member, amount, memo));
    }
}
