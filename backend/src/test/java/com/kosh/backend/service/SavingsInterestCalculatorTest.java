package com.kosh.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.kosh.backend.service.SavingsInterestCalculator.Basis;
import com.kosh.backend.service.SavingsInterestCalculator.DayCount;

class SavingsInterestCalculatorTest {
    private final SavingsInterestCalculator calculator = new SavingsInterestCalculator();

    @Test
    void supportsDailyMinimumAndAverageBalanceBases() {
        List<BigDecimal> balances = List.of(amount("1000"), amount("600"), amount("800"));
        LocalDate date = LocalDate.of(2026, 8, 10);

        assertThat(calculator.calculate(balances, Basis.DAILY_PRODUCT, amount("12"), DayCount.ACTUAL_365, date)
                .basisAmount()).isEqualByComparingTo("800.00");
        assertThat(calculator.calculate(balances, Basis.MINIMUM_MONTHLY_BALANCE, amount("12"), DayCount.ACTUAL_365, date)
                .basisAmount()).isEqualByComparingTo("600.00");
        assertThat(calculator.calculate(balances, Basis.AVERAGE_BALANCE, amount("12"), DayCount.ACTUAL_365, date)
                .basisAmount()).isEqualByComparingTo("800.00");
    }

    @Test
    void dayCountConventionChangesDailyAccrualExplicitly() {
        LocalDate date = LocalDate.of(2026, 8, 10);
        var actual = calculator.calculate(List.of(amount("36500")), Basis.DAILY_PRODUCT,
                amount("12"), DayCount.ACTUAL_365, date);
        var thirty360 = calculator.calculate(List.of(amount("36500")), Basis.DAILY_PRODUCT,
                amount("12"), DayCount.THIRTY_360, date);

        assertThat(actual.interestAmount()).isEqualByComparingTo("12.00");
        assertThat(thirty360.interestAmount()).isEqualByComparingTo("12.17");
        assertThat(actual.denominator()).isEqualTo(365);
        assertThat(thirty360.denominator()).isEqualTo(360);
    }

    private BigDecimal amount(String value) { return new BigDecimal(value); }
}
