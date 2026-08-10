package com.kosh.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.kosh.backend.model.RepaymentSchedule;

class RepaymentAllocationTest {

    @Test
    void interestIsSettledBeforePrincipalWithinAnInstallment() {
        List<RepaymentSchedule> schedule = schedule(2, "1000.00", "100.00");

        RepaymentAllocation.Result result = RepaymentAllocation.allocate(schedule, new BigDecimal("60.00"));

        assertThat(result.interest()).isEqualByComparingTo("60.00");
        assertThat(result.principal()).isEqualByComparingTo("0.00");
        assertThat(schedule.get(0).getStatus()).isEqualTo("PARTIAL");
    }

    @Test
    void aFullInstallmentClearsBothHalvesAndIsMarkedPaid() {
        List<RepaymentSchedule> schedule = schedule(2, "1000.00", "100.00");

        RepaymentAllocation.Result result = RepaymentAllocation.allocate(schedule, new BigDecimal("1100.00"));

        assertThat(result.interest()).isEqualByComparingTo("100.00");
        assertThat(result.principal()).isEqualByComparingTo("1000.00");
        assertThat(schedule.get(0).getStatus()).isEqualTo("PAID");
        assertThat(schedule.get(1).getStatus()).isEqualTo("PENDING");
    }

    @Test
    void paymentsSpillIntoTheNextInstallmentOldestFirst() {
        List<RepaymentSchedule> schedule = schedule(3, "1000.00", "100.00");

        RepaymentAllocation.Result result = RepaymentAllocation.allocate(schedule, new BigDecimal("1500.00"));

        assertThat(result.interest()).isEqualByComparingTo("200.00");   // both installments' interest
        assertThat(result.principal()).isEqualByComparingTo("1300.00");
        assertThat(schedule.get(0).getStatus()).isEqualTo("PAID");
        assertThat(schedule.get(1).getStatus()).isEqualTo("PARTIAL");
        assertThat(schedule.get(2).getStatus()).isEqualTo("PENDING");
        assertThat(result.total()).isEqualByComparingTo("1500.00");
    }

    @Test
    void aSecondPaymentContinuesWhereTheFirstStopped() {
        List<RepaymentSchedule> schedule = schedule(2, "1000.00", "100.00");

        RepaymentAllocation.allocate(schedule, new BigDecimal("60.00"));
        RepaymentAllocation.Result second = RepaymentAllocation.allocate(schedule, new BigDecimal("1040.00"));

        assertThat(second.interest()).isEqualByComparingTo("40.00");
        assertThat(second.principal()).isEqualByComparingTo("1000.00");
        assertThat(schedule.get(0).getStatus()).isEqualTo("PAID");
    }

    @Test
    void moneyBeyondTheScheduleComesBackUnallocatedRatherThanVanishing() {
        List<RepaymentSchedule> schedule = schedule(1, "1000.00", "100.00");

        RepaymentAllocation.Result result = RepaymentAllocation.allocate(schedule, new BigDecimal("1500.00"));

        assertThat(result.interest()).isEqualByComparingTo("100.00");
        assertThat(result.principal()).isEqualByComparingTo("1000.00");
        assertThat(result.unallocated()).isEqualByComparingTo("400.00");
    }

    @Test
    void everyRupeeIsAccountedForOnAFullSettlement() {
        List<RepaymentSchedule> schedule = schedule(6, "1666.67", "83.33");

        RepaymentAllocation.Result result = RepaymentAllocation.allocate(schedule, new BigDecimal("10500.00"));

        assertThat(result.interest().add(result.principal()).add(result.unallocated()))
                .isEqualByComparingTo("10500.00");
        assertThat(schedule).allSatisfy(installment ->
                assertThat(installment.getStatus()).isEqualTo("PAID"));
    }

    @Test
    void aNonPositivePaymentIsRefused() {
        assertThatThrownBy(() -> RepaymentAllocation.allocate(schedule(1, "1000.00", "100.00"), BigDecimal.ZERO))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("positive");
    }

    private List<RepaymentSchedule> schedule(int installments, String principal, String interest) {
        List<RepaymentSchedule> schedule = new java.util.ArrayList<>();
        for (int i = 1; i <= installments; i++) {
            RepaymentSchedule installment = new RepaymentSchedule();
            installment.setInstallmentNumber(i);
            installment.setDueDate(LocalDate.of(2026, 1, 1).plusMonths(i));
            installment.setPrincipalAmount(new BigDecimal(principal));
            installment.setInterestAmount(new BigDecimal(interest));
            installment.setTotalDue(new BigDecimal(principal).add(new BigDecimal(interest)));
            installment.setStatus("PENDING");
            schedule.add(installment);
        }
        return schedule;
    }
}
