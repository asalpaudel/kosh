package com.kosh.backend.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kosh.backend.calendar.BikramSambatCalendar;
import com.kosh.backend.calendar.BsDate;
import com.kosh.backend.ledger.Accounts;
import com.kosh.backend.ledger.LedgerPostings;
import com.kosh.backend.ledger.LedgerService;
import com.kosh.backend.model.ApplicationStatus;
import com.kosh.backend.model.JournalEntry;
import com.kosh.backend.model.Network;
import com.kosh.backend.model.SavingAccount;
import com.kosh.backend.model.SavingAccountApplication;
import com.kosh.backend.model.SavingsInterestAccrual;
import com.kosh.backend.model.TransactionType;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.JournalLineRepository;
import com.kosh.backend.repository.SavingAccountApplicationRepository;
import com.kosh.backend.repository.SavingsInterestAccrualRepository;
import com.kosh.backend.service.SavingsInterestCalculator.Basis;
import com.kosh.backend.service.SavingsInterestCalculator.DayCount;

@Service
public class SavingsInterestService {
    private static final ZoneId NEPAL_TIME = ZoneId.of("Asia/Kathmandu");

    private final SavingAccountApplicationRepository applications;
    private final SavingsInterestAccrualRepository accruals;
    private final JournalLineRepository journalLines;
    private final LedgerService ledger;
    private final BikramSambatCalendar calendar;
    private final SavingsInterestCalculator calculator;

    public SavingsInterestService(SavingAccountApplicationRepository applications,
            SavingsInterestAccrualRepository accruals, JournalLineRepository journalLines,
            LedgerService ledger, BikramSambatCalendar calendar, SavingsInterestCalculator calculator) {
        this.applications = applications;
        this.accruals = accruals;
        this.journalLines = journalLines;
        this.ledger = ledger;
        this.calendar = calendar;
        this.calculator = calculator;
    }

    @Transactional
    public int accrueNetwork(Network network, LocalDate accrualDate, String actor) {
        int processed = 0;
        for (SavingAccountApplication application : applications
                .findByNetworkIdAndStatusOrderByIdAsc(network.getId(), ApplicationStatus.APPROVED)) {
            if (application.getTransactionType() != TransactionType.DEPOSIT) continue;
            accrue(application, accrualDate, actor);
            processed++;
        }
        return processed;
    }

    @Transactional(readOnly = true)
    public List<SavingsInterestAccrual> history(Long networkId) {
        return accruals.findByNetworkIdOrderByAccrualDateDescIdDesc(networkId);
    }

    @Transactional
    public SavingsInterestAccrual accrue(SavingAccountApplication application, LocalDate accrualDate, String actor) {
        SavingAccount product = application.getSavingAccount();
        User member = application.getUser();
        Network network = application.getNetwork();
        SavingsInterestAccrual existing = accruals.findBySavingAccountIdAndMemberIdAndAccrualDate(
                product.getId(), member.getId(), accrualDate).orElse(null);
        if (existing != null) return existing;
        if (application.getReviewDate() != null
                && application.getReviewDate().atZone(NEPAL_TIME).toLocalDate().isAfter(accrualDate)) {
            throw new IllegalArgumentException("Interest cannot accrue before account approval");
        }

        Basis basis = enumValue(Basis.class, product.getInterestBasis(), "interest basis");
        DayCount dayCount = enumValue(DayCount.class, product.getDayCountConvention(), "day-count convention");
        String frequency = requireFrequency(product.getCapitalizationFrequency());
        LocalDate accountStart = application.getReviewDate() == null
                ? BikramSambatCalendar.MIN_AD
                : application.getReviewDate().atZone(NEPAL_TIME).toLocalDate();
        LocalDate monthStart = bsMonthStart(accrualDate);
        LocalDate basisStart = basis == Basis.DAILY_PRODUCT ? accrualDate : later(monthStart, accountStart);
        LocalDate capitalizationStart = later(capitalizationStart(accrualDate, frequency), accountStart);
        List<BigDecimal> balances = eligibleBalances(member.getId(), product.getId(), basisStart,
                accrualDate, capitalizationStart);
        var calculation = calculator.calculate(balances, basis, product.getInterestRate(), dayCount, accrualDate);
        BigDecimal eligibleBasis = calculation.basisAmount().compareTo(product.getMinBalance()) < 0
                ? Money.ZERO : calculation.basisAmount();
        BigDecimal interest = eligibleBasis.signum() == 0 ? Money.ZERO
                : calculator.calculate(List.of(eligibleBasis), Basis.DAILY_PRODUCT,
                        product.getInterestRate(), dayCount, accrualDate).interestAmount();

        SavingsInterestAccrual value = new SavingsInterestAccrual();
        value.setNetwork(network);
        value.setSavingAccount(product);
        value.setMember(member);
        value.setAccrualDate(accrualDate);
        value.setInterestBasis(basis.name());
        value.setCapitalizationFrequency(frequency);
        value.setDayCountConvention(dayCount.name());
        value.setCapitalizationPeriodStart(capitalizationStart);
        value.setBasisAmount(Money.round(eligibleBasis));
        value.setAnnualRate(product.getInterestRate().setScale(4, java.math.RoundingMode.HALF_UP));
        value.setAccruedAmount(Money.round(interest));
        value.setCreatedAt(Instant.now());
        if (interest.signum() > 0) {
            String narration = "Daily savings interest for " + product.getName();
            JournalEntry journal = ledger.post(network, accrualDate, narration,
                    "INT-" + product.getId() + "-" + member.getId() + "-" + accrualDate,
                    "SAVINGS_INTEREST", application.getId(), actor,
                    LedgerPostings.savingsInterest(member, interest, narration));
            value.setJournalEntry(journal);
        }
        return accruals.save(value);
    }

    private List<BigDecimal> eligibleBalances(Long memberId, Long productId, LocalDate from, LocalDate to,
            LocalDate capitalizationStart) {
        BigDecimal closing = Money.round(journalLines.memberOpeningBalance(Accounts.MEMBER_SAVINGS, memberId, from));
        Map<LocalDate, BigDecimal> movements = new HashMap<>();
        for (Object[] row : journalLines.memberDailyMovements(Accounts.MEMBER_SAVINGS, memberId, from, to)) {
            movements.put((LocalDate) row[0], Money.round((BigDecimal) row[1]));
        }
        Map<LocalDate, BigDecimal> interestByDate = new HashMap<>();
        LocalDate interestEnd = to.minusDays(1);
        if (!interestEnd.isBefore(capitalizationStart)) {
            for (SavingsInterestAccrual accrual : accruals
                    .findBySavingAccountIdAndMemberIdAndAccrualDateBetweenOrderByAccrualDateAsc(
                            productId, memberId, capitalizationStart, interestEnd)) {
                interestByDate.put(accrual.getAccrualDate(), accrual.getAccruedAmount());
            }
        }
        BigDecimal uncapitalized = Money.ZERO;
        for (Map.Entry<LocalDate, BigDecimal> item : interestByDate.entrySet()) {
            if (item.getKey().isBefore(from)) uncapitalized = uncapitalized.add(item.getValue());
        }
        List<BigDecimal> result = new ArrayList<>();
        for (LocalDate day = from; !day.isAfter(to); day = day.plusDays(1)) {
            closing = closing.add(movements.getOrDefault(day, Money.ZERO));
            uncapitalized = uncapitalized.add(interestByDate.getOrDefault(day, Money.ZERO));
            result.add(Money.round(closing.subtract(uncapitalized).max(BigDecimal.ZERO)));
        }
        return result;
    }

    private LocalDate capitalizationStart(LocalDate date, String frequency) {
        BsDate bs = calendar.toBs(date);
        return switch (frequency) {
            case "DAILY" -> date;
            case "MONTHLY" -> calendar.toAd(new BsDate(bs.year(), bs.month(), 1));
            case "QUARTERLY" -> calendar.toAd(new BsDate(bs.year(), ((bs.month() - 1) / 3) * 3 + 1, 1));
            case "ANNUALLY" -> calendar.fiscalYearFor(date).startAd();
            default -> throw new IllegalArgumentException("Unsupported capitalization frequency");
        };
    }

    private LocalDate bsMonthStart(LocalDate date) {
        BsDate bs = calendar.toBs(date);
        return calendar.toAd(new BsDate(bs.year(), bs.month(), 1));
    }

    private String requireFrequency(String value) {
        return switch (value == null ? "" : value) {
            case "DAILY", "MONTHLY", "QUARTERLY", "ANNUALLY" -> value;
            default -> throw new IllegalArgumentException("Unsupported capitalization frequency");
        };
    }

    private <E extends Enum<E>> E enumValue(Class<E> type, String value, String label) {
        try { return Enum.valueOf(type, value == null ? "" : value); }
        catch (IllegalArgumentException exception) { throw new IllegalArgumentException("Unsupported " + label); }
    }

    private LocalDate later(LocalDate first, LocalDate second) {
        return first.isAfter(second) ? first : second;
    }
}
