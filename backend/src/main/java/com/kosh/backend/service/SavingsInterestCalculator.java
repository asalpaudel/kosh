package com.kosh.backend.service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;

import org.springframework.stereotype.Component;

@Component
public class SavingsInterestCalculator {
    private static final MathContext CALCULATION = new MathContext(18, RoundingMode.HALF_UP);

    public enum Basis { MINIMUM_MONTHLY_BALANCE, DAILY_PRODUCT, AVERAGE_BALANCE }
    public enum DayCount { ACTUAL_365, ACTUAL_366, THIRTY_360 }

    public Calculation calculate(List<BigDecimal> dailyBalances, Basis basis, BigDecimal annualRate,
            DayCount dayCount, LocalDate accrualDate) {
        if (dailyBalances == null || dailyBalances.isEmpty() || basis == null || annualRate == null
                || annualRate.signum() < 0 || annualRate.compareTo(new BigDecimal("100")) > 0
                || dayCount == null || accrualDate == null) {
            throw new IllegalArgumentException("Interest calculation inputs are invalid");
        }
        List<BigDecimal> nonNegative = dailyBalances.stream()
                .map(value -> value == null || value.signum() < 0 ? Money.ZERO : value)
                .toList();
        BigDecimal basisAmount = switch (basis) {
            case MINIMUM_MONTHLY_BALANCE -> nonNegative.stream().min(BigDecimal::compareTo).orElse(Money.ZERO);
            case DAILY_PRODUCT -> nonNegative.get(nonNegative.size() - 1);
            case AVERAGE_BALANCE -> nonNegative.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(nonNegative.size()), CALCULATION);
        };
        basisAmount = Money.round(basisAmount);
        int denominator = switch (dayCount) {
            case ACTUAL_365 -> 365;
            case ACTUAL_366 -> Year.isLeap(accrualDate.getYear()) ? 366 : 365;
            case THIRTY_360 -> 360;
        };
        BigDecimal interest = basisAmount.multiply(annualRate, CALCULATION)
                .divide(new BigDecimal("100"), CALCULATION)
                .divide(BigDecimal.valueOf(denominator), CALCULATION);
        return new Calculation(basisAmount, Money.round(interest), denominator);
    }

    public record Calculation(BigDecimal basisAmount, BigDecimal interestAmount, int denominator) {}
}
