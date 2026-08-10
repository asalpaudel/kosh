package com.kosh.backend.service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.kosh.backend.model.LoanApplication;
import com.kosh.backend.model.RepaymentSchedule;
import com.kosh.backend.repository.RepaymentScheduleRepository;

@Service
public class LoanService {

    /** Intermediate rate arithmetic keeps far more digits than it reports, so rounding happens once. */
    private static final MathContext RATE_CONTEXT = new MathContext(20, RoundingMode.HALF_UP);

    private static final BigDecimal MONTHS_PER_YEAR = BigDecimal.valueOf(12);
    private static final BigDecimal PERCENT = BigDecimal.valueOf(100);

    private final RepaymentScheduleRepository scheduleRepo;

    public LoanService(RepaymentScheduleRepository scheduleRepo) {
        this.scheduleRepo = scheduleRepo;
    }

    public void generateRepaymentSchedule(LoanApplication loan) {
        BigDecimal principal = loan.getApprovedAmount();
        BigDecimal annualRate = loan.getInterestRate(); // e.g. 12.00 for 12%
        int months = loan.getDurationInMonths();
        LocalDate startDate = loan.getStartDate();

        BigDecimal monthlyRate = annualRate.divide(MONTHS_PER_YEAR, RATE_CONTEXT)
                                           .divide(PERCENT, RATE_CONTEXT);
        BigDecimal emi = equatedInstallment(principal, monthlyRate, months);

        BigDecimal outstanding = principal;
        List<RepaymentSchedule> schedules = new ArrayList<>();

        for (int i = 1; i <= months; i++) {
            BigDecimal interestPart = money(outstanding.multiply(monthlyRate, RATE_CONTEXT));
            BigDecimal principalPart;
            BigDecimal due;

            if (i == months) {
                // The final installment absorbs every rounding remainder, so the schedule
                // sums back to exactly the disbursed principal.
                principalPart = outstanding;
                due = principalPart.add(interestPart);
            } else {
                principalPart = money(emi.subtract(interestPart));
                due = principalPart.add(interestPart);
            }

            outstanding = outstanding.subtract(principalPart);

            RepaymentSchedule schedule = new RepaymentSchedule();
            schedule.setLoanApplication(loan);
            schedule.setInstallmentNumber(i);
            schedule.setDueDate(startDate.plusMonths(i));
            schedule.setPrincipalAmount(principalPart);
            schedule.setInterestAmount(interestPart);
            schedule.setTotalDue(due);
            schedule.setStatus("PENDING");

            schedules.add(schedule);
        }

        scheduleRepo.saveAll(schedules);

        if (!schedules.isEmpty()) {
            loan.setNextPaymentDate(schedules.get(0).getDueDate());
        }
    }

    /** EMI = P·r·(1+r)^n / ((1+r)^n − 1), degrading to straight-line when the rate is zero. */
    static BigDecimal equatedInstallment(BigDecimal principal, BigDecimal monthlyRate, int months) {
        if (monthlyRate.signum() == 0) {
            return money(principal.divide(BigDecimal.valueOf(months), RATE_CONTEXT));
        }
        BigDecimal growth = BigDecimal.ONE.add(monthlyRate).pow(months, RATE_CONTEXT);
        return money(principal.multiply(monthlyRate, RATE_CONTEXT).multiply(growth, RATE_CONTEXT)
                .divide(growth.subtract(BigDecimal.ONE), RATE_CONTEXT));
    }

    static BigDecimal money(BigDecimal value) {
        return Money.round(value);
    }
}
