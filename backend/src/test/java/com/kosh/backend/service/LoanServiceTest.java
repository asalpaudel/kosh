package com.kosh.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.kosh.backend.model.LoanApplication;
import com.kosh.backend.model.RepaymentSchedule;
import com.kosh.backend.repository.RepaymentScheduleRepository;

class LoanServiceTest {

    private final RepaymentScheduleRepository scheduleRepo = mock(RepaymentScheduleRepository.class);
    private final LoanService loanService = new LoanService(scheduleRepo);

    @Test
    void scheduleRepaysExactlyThePrincipalWithNoRoundingDrift() {
        List<RepaymentSchedule> schedule = generate("100000.00", "12.00", 24);

        BigDecimal principalRepaid = schedule.stream()
                .map(RepaymentSchedule::getPrincipalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertThat(principalRepaid).isEqualByComparingTo(new BigDecimal("100000.00"));
    }

    @Test
    void everyInstallmentIsExactToTwoDecimalsAndTotalsItsParts() {
        for (RepaymentSchedule installment : generate("75500.55", "9.75", 18)) {
            assertThat(installment.getPrincipalAmount().scale()).isEqualTo(2);
            assertThat(installment.getInterestAmount().scale()).isEqualTo(2);
            assertThat(installment.getTotalDue())
                    .isEqualByComparingTo(installment.getPrincipalAmount().add(installment.getInterestAmount()));
        }
    }

    @Test
    void interestFreeLoanSplitsPrincipalEvenlyAndChargesNothingExtra() {
        List<RepaymentSchedule> schedule = generate("12000.00", "0.00", 12);

        assertThat(schedule).hasSize(12);
        assertThat(schedule).allSatisfy(installment ->
                assertThat(installment.getInterestAmount()).isEqualByComparingTo(BigDecimal.ZERO));
        assertThat(schedule.stream().map(RepaymentSchedule::getPrincipalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add))
                .isEqualByComparingTo(new BigDecimal("12000.00"));
    }

    @Test
    void firstDueDateBecomesTheNextPaymentDate() {
        LoanApplication loan = loan("50000.00", "10.00", 6);
        loanService.generateRepaymentSchedule(loan);

        assertThat(loan.getNextPaymentDate()).isEqualTo(loan.getStartDate().plusMonths(1));
    }

    @SuppressWarnings("unchecked")
    private List<RepaymentSchedule> generate(String principal, String annualRate, int months) {
        loanService.generateRepaymentSchedule(loan(principal, annualRate, months));

        ArgumentCaptor<List<RepaymentSchedule>> captor = ArgumentCaptor.forClass(List.class);
        verify(scheduleRepo).saveAll(captor.capture());
        return captor.getValue();
    }

    private LoanApplication loan(String principal, String annualRate, int months) {
        LoanApplication loan = new LoanApplication();
        loan.setApprovedAmount(new BigDecimal(principal));
        loan.setInterestRate(new BigDecimal(annualRate));
        loan.setDurationInMonths(months);
        loan.setStartDate(LocalDate.of(2026, 1, 15));
        return loan;
    }
}
