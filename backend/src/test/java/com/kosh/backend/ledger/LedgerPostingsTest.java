package com.kosh.backend.ledger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.kosh.backend.model.User;

class LedgerPostingsTest {

    private final User member = member();

    @Test
    void everyMappingBalances() {
        List<List<LedgerLine>> postings = List.of(
                memberPosting(LedgerPostings.SAVINGS, "Credit", "Cash"),
                memberPosting(LedgerPostings.SAVINGS, "Debit", "Cash"),
                memberPosting(LedgerPostings.FIXED_DEPOSIT, "Credit", "Cheque"),
                memberPosting(LedgerPostings.FIXED_DEPOSIT, "Debit", "Transfer"),
                memberPosting(LedgerPostings.LOAN, "Debit", "Cash"),
                memberPosting(LedgerPostings.LOAN, "Credit", "Cash"),
                networkPosting("Income: Membership fee", "Credit", "Cash"),
                networkPosting("Expense: Office Rent", "Debit", "Bank"),
                LedgerPostings.savingsToFixedDeposit(member, amount("1000.00"), "transfer"),
                LedgerPostings.loanDisbursedToSavings(member, amount("1000.00"), "disbursement"),
                LedgerPostings.sharePurchase(member, amount("1000.00"), "Cash", "purchase"),
                LedgerPostings.shareRefund(member, amount("1000.00"), "Bank", "refund"),
                LedgerPostings.shareTransfer(member, anotherMember(), amount("1000.00"), "transfer"));

        for (List<LedgerLine> posting : postings) {
            BigDecimal debits = posting.stream().map(LedgerLine::debit).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal credits = posting.stream().map(LedgerLine::credit).reduce(BigDecimal.ZERO, BigDecimal::add);
            assertThat(debits).as("posting %s", posting).isEqualByComparingTo(credits);
            assertThat(posting).hasSize(2);
        }
    }

    @Test
    void savingsDepositIncreasesCashAndWhatTheCooperativeOwesTheMember() {
        List<LedgerLine> posting = memberPosting(LedgerPostings.SAVINGS, "Credit", "Cash");

        assertThat(posting.get(0).accountCode()).isEqualTo(Accounts.CASH);
        assertThat(posting.get(0).debit()).isEqualByComparingTo(amount("1000.00"));
        assertThat(posting.get(1).accountCode()).isEqualTo(Accounts.MEMBER_SAVINGS);
        assertThat(posting.get(1).credit()).isEqualByComparingTo(amount("1000.00"));
        assertThat(posting.get(1).member()).isSameAs(member);
    }

    @Test
    void loanDisbursementIsADebitToLoansReceivable() {
        List<LedgerLine> posting = memberPosting(LedgerPostings.LOAN, "Debit", "Cash");

        assertThat(posting.get(0).accountCode()).isEqualTo(Accounts.LOANS_RECEIVABLE);
        assertThat(posting.get(0).debit()).isEqualByComparingTo(amount("1000.00"));
        assertThat(posting.get(1).accountCode()).isEqualTo(Accounts.CASH);
    }

    @Test
    void loanRepaymentReducesLoansReceivable() {
        List<LedgerLine> posting = memberPosting(LedgerPostings.LOAN, "Credit", "Cash");

        assertThat(posting.get(1).accountCode()).isEqualTo(Accounts.LOANS_RECEIVABLE);
        assertThat(posting.get(1).credit()).isEqualByComparingTo(amount("1000.00"));
    }

    @Test
    void chequeAndTransferSettleThroughTheBankRatherThanCash() {
        assertThat(memberPosting(LedgerPostings.SAVINGS, "Credit", "Cheque").get(0).accountCode())
                .isEqualTo(Accounts.BANK);
        assertThat(memberPosting(LedgerPostings.SAVINGS, "Credit", "Transfer").get(0).accountCode())
                .isEqualTo(Accounts.BANK);
        assertThat(memberPosting(LedgerPostings.SAVINGS, "Credit", null).get(0).accountCode())
                .isEqualTo(Accounts.CASH);
    }

    @Test
    void shareMovementsUseMemberSubledgerOnShareCapital() {
        User recipient = anotherMember();
        var purchase = LedgerPostings.sharePurchase(member, amount("1000.00"), "Cash", "purchase");
        var transfer = LedgerPostings.shareTransfer(member, recipient, amount("400.00"), "transfer");
        var refund = LedgerPostings.shareRefund(member, amount("600.00"), "Bank", "refund");

        assertThat(purchase.get(0).accountCode()).isEqualTo(Accounts.CASH);
        assertThat(purchase.get(1).accountCode()).isEqualTo(Accounts.SHARE_CAPITAL);
        assertThat(purchase.get(1).member()).isSameAs(member);
        assertThat(transfer.get(0).debit()).isEqualByComparingTo("400.00");
        assertThat(transfer.get(0).member()).isSameAs(member);
        assertThat(transfer.get(1).member()).isSameAs(recipient);
        assertThat(refund.get(1).accountCode()).isEqualTo(Accounts.BANK);
    }

    @Test
    void unrecognisedInputIsRefusedRatherThanMisPosted() {
        assertThatThrownBy(() -> memberPosting("Office Rent", "Credit", "Cash"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown member account head");

        assertThatThrownBy(() -> memberPosting(LedgerPostings.SAVINGS, "Sideways", "Cash"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown transaction direction");

        assertThatThrownBy(() -> networkPosting("Expense: Rent", "Credit", "Cash"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("must be income");

        assertThatThrownBy(() -> LedgerPostings.forTransaction("member", LedgerPostings.SAVINGS, "Credit",
                "Cash", null, amount("0.00"), member, "zero"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("positive amount");

        assertThatThrownBy(() -> LedgerPostings.forTransaction("member", LedgerPostings.SAVINGS, "Credit",
                "Cash", null, amount("100.00"), null, "no member"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("must name the member");
    }

    private List<LedgerLine> memberPosting(String head, String direction, String paymentMethod) {
        return LedgerPostings.forTransaction("member", head, direction, paymentMethod, null,
                amount("1000.00"), member, "memo");
    }

    private List<LedgerLine> networkPosting(String head, String direction, String networkLedger) {
        return LedgerPostings.forTransaction("network", head, direction, null, networkLedger,
                amount("1000.00"), null, "memo");
    }

    private static User member() {
        User user = new User();
        user.setId(9L);
        user.setName("Member");
        return user;
    }

    private static User anotherMember() {
        User user = new User();
        user.setId(10L);
        user.setName("Another member");
        return user;
    }

    private static BigDecimal amount(String value) {
        return new BigDecimal(value);
    }
}
