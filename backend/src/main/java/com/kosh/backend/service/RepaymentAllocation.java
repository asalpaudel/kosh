package com.kosh.backend.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import com.kosh.backend.model.RepaymentSchedule;

/**
 * Splits a member's loan repayment between interest and principal.
 *
 * <p>Installments are settled oldest first, and within each installment the interest is
 * cleared before the principal — the usual cooperative policy, and the reason the split
 * matters: the interest half is the cooperative's income, the principal half merely
 * reduces what the member owes. Posting the whole payment against principal, as the
 * system did before, understates income and overstates repayment.
 *
 * <p>ponytail: allocation order is fixed. Make it configurable per cooperative when one
 * asks for a different policy, not before.
 */
public final class RepaymentAllocation {

    public record Result(BigDecimal interest, BigDecimal principal, BigDecimal unallocated,
                         List<RepaymentSchedule> touched) {

        public BigDecimal total() {
            return interest.add(principal);
        }
    }

    private RepaymentAllocation() {
    }

    /**
     * Applies {@code payment} to the given schedule, mutating each installment it touches.
     * Anything left after every installment is settled comes back as {@code unallocated} —
     * an early settlement or an overpayment, which the caller decides what to do with.
     */
    public static Result allocate(List<RepaymentSchedule> schedule, BigDecimal payment) {
        BigDecimal remaining = Money.round(Money.orZero(payment));
        if (remaining.signum() <= 0) {
            throw new IllegalArgumentException("A repayment must be a positive amount");
        }

        BigDecimal interestPaid = Money.ZERO;
        BigDecimal principalPaid = Money.ZERO;
        List<RepaymentSchedule> touched = new ArrayList<>();

        for (RepaymentSchedule installment : schedule) {
            if (remaining.signum() == 0) break;
            if (installment.outstanding().signum() <= 0) continue;

            BigDecimal interestDue = installment.getInterestAmount().subtract(installment.getInterestPaid());
            BigDecimal toInterest = interestDue.min(remaining);
            if (toInterest.signum() > 0) {
                installment.setInterestPaid(installment.getInterestPaid().add(toInterest));
                interestPaid = interestPaid.add(toInterest);
                remaining = remaining.subtract(toInterest);
            }

            BigDecimal principalDue = installment.getPrincipalAmount().subtract(installment.getPrincipalPaid());
            BigDecimal toPrincipal = principalDue.min(remaining);
            if (toPrincipal.signum() > 0) {
                installment.setPrincipalPaid(installment.getPrincipalPaid().add(toPrincipal));
                principalPaid = principalPaid.add(toPrincipal);
                remaining = remaining.subtract(toPrincipal);
            }

            if (toInterest.signum() > 0 || toPrincipal.signum() > 0) {
                installment.setStatus(installment.outstanding().signum() == 0 ? "PAID" : "PARTIAL");
                touched.add(installment);
            }
        }

        return new Result(interestPaid, principalPaid, remaining, touched);
    }
}
