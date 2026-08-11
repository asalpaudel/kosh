package com.kosh.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kosh.backend.ledger.LedgerPostings;
import com.kosh.backend.ledger.LedgerService;
import com.kosh.backend.model.ApplicationStatus;
import com.kosh.backend.model.JournalEntry;
import com.kosh.backend.model.LoanApplication;
import com.kosh.backend.model.LoanClassification;
import com.kosh.backend.model.LoanRiskSetting;
import com.kosh.backend.model.Network;
import com.kosh.backend.model.RepaymentSchedule;
import com.kosh.backend.repository.LoanApplicationRepository;
import com.kosh.backend.repository.LoanClassificationRepository;
import com.kosh.backend.repository.LoanRiskSettingRepository;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.repository.RepaymentScheduleRepository;

@Service
public class LoanRiskService {
    private static final Set<String> NPA_CLASSES = Set.of("SUBSTANDARD", "DOUBTFUL", "LOSS");

    private final LoanRiskSettingRepository settings;
    private final LoanClassificationRepository classifications;
    private final LoanApplicationRepository loans;
    private final RepaymentScheduleRepository schedules;
    private final NetworkRepository networks;
    private final LedgerService ledger;

    public LoanRiskService(LoanRiskSettingRepository settings, LoanClassificationRepository classifications,
            LoanApplicationRepository loans, RepaymentScheduleRepository schedules,
            NetworkRepository networks, LedgerService ledger) {
        this.settings = settings; this.classifications = classifications; this.loans = loans;
        this.schedules = schedules; this.networks = networks; this.ledger = ledger;
    }

    @Transactional
    public LoanRiskSetting settings(Network network) {
        return settings.findByNetworkId(network.getId()).orElseGet(() -> {
            LoanRiskSetting value = new LoanRiskSetting(); value.setNetwork(network); return settings.save(value);
        });
    }

    @Transactional
    public LoanRiskSetting updateSettings(Network network, RiskSettingsInput input) {
        validate(input);
        networks.lockForPosting(network.getId());
        LoanRiskSetting value = settings(network);
        value.setWatchlistDays(input.watchlistDays()); value.setSubstandardDays(input.substandardDays());
        value.setDoubtfulDays(input.doubtfulDays()); value.setLossDays(input.lossDays());
        value.setPassRate(input.passRate()); value.setWatchlistRate(input.watchlistRate());
        value.setSubstandardRate(input.substandardRate()); value.setDoubtfulRate(input.doubtfulRate());
        value.setLossRate(input.lossRate());
        return settings.save(value);
    }

    @Transactional
    public int classifyNetwork(Network network, LocalDate date, String actor) {
        networks.lockForPosting(network.getId());
        LoanRiskSetting setting = settings(network);
        int processed = 0;
        for (LoanApplication loan : loans.findByNetworkIdAndStatusOrderByIdAsc(
                network.getId(), ApplicationStatus.APPROVED)) {
            classify(loan, date, actor, setting); processed++;
        }
        return processed;
    }

    @Transactional
    public LoanClassification classify(LoanApplication loan, LocalDate date, String actor,
            LoanRiskSetting setting) {
        LoanClassification existing = classifications
                .findByLoanApplicationIdAndClassificationDate(loan.getId(), date).orElse(null);
        if (existing != null) return existing;
        Assessment assessment = assess(loan, date, setting);
        BigDecimal previous = Money.round(loan.getProvisionBalance());
        BigDecimal change = Money.round(assessment.requiredProvision().subtract(previous));
        JournalEntry journal = null;
        if (change.signum() != 0) {
            String narration = "Loan #" + loan.getId() + " provision " + assessment.classification();
            journal = ledger.post(loan.getNetwork(), date, narration, "PROV-" + loan.getId() + "-" + date,
                    "LOAN_PROVISION", loan.getId(), actor, LedgerPostings.loanProvision(change, narration));
        }
        LoanClassification value = new LoanClassification(); value.setNetwork(loan.getNetwork());
        value.setLoanApplication(loan); value.setClassificationDate(date);
        value.setOldestOverdueDate(assessment.oldestOverdueDate());
        value.setDaysPastDue(assessment.daysPastDue()); value.setClassification(assessment.classification());
        value.setOutstandingPrincipal(assessment.outstandingPrincipal());
        value.setProvisionRate(assessment.provisionRate());
        value.setRequiredProvision(assessment.requiredProvision()); value.setPreviousProvision(previous);
        value.setProvisionChange(change); value.setJournalEntry(journal); value.setCreatedAt(Instant.now());
        loan.setRiskClassification(assessment.classification());
        loan.setProvisionBalance(assessment.requiredProvision()); loans.save(loan);
        return classifications.save(value);
    }

    @Transactional(readOnly = true)
    public RiskReport report(Network network, LocalDate asOf) {
        LoanRiskSetting setting = settings.findByNetworkId(network.getId()).orElseGet(LoanRiskSetting::new);
        List<RiskRow> rows = new ArrayList<>();
        BigDecimal total = Money.ZERO; BigDecimal npa = Money.ZERO;
        BigDecimal par30 = Money.ZERO; BigDecimal par60 = Money.ZERO; BigDecimal par90 = Money.ZERO;
        BigDecimal provision = Money.ZERO;
        for (LoanApplication loan : loans.findByNetworkIdAndStatusOrderByIdAsc(
                network.getId(), ApplicationStatus.APPROVED)) {
            Assessment assessment = assess(loan, asOf, setting);
            rows.add(new RiskRow(loan.getId(), loan.getUser().getId(), loan.getUser().getName(),
                    loan.getLoanPackage().getName(), assessment.oldestOverdueDate(), assessment.daysPastDue(),
                    assessment.classification(), assessment.outstandingPrincipal(), assessment.provisionRate(),
                    assessment.requiredProvision()));
            BigDecimal exposure = assessment.outstandingPrincipal(); total = total.add(exposure);
            provision = provision.add(assessment.requiredProvision());
            if (NPA_CLASSES.contains(assessment.classification())) npa = npa.add(exposure);
            if (assessment.daysPastDue() >= 30) par30 = par30.add(exposure);
            if (assessment.daysPastDue() >= 60) par60 = par60.add(exposure);
            if (assessment.daysPastDue() >= 90) par90 = par90.add(exposure);
        }
        return new RiskReport(asOf, Money.round(total), Money.round(provision), ratio(npa, total),
                ratio(par30, total), ratio(par60, total), ratio(par90, total), rows);
    }

    Assessment assess(LoanApplication loan, LocalDate asOf, LoanRiskSetting setting) {
        List<RepaymentSchedule> items = schedules.findByLoanApplicationIdOrderByDueDateAsc(loan.getId());
        BigDecimal outstanding = items.stream()
                .map(item -> item.getPrincipalAmount().subtract(item.getPrincipalPaid()).max(Money.ZERO))
                .reduce(Money.ZERO, BigDecimal::add);
        LocalDate oldest = items.stream().filter(item -> item.outstanding().signum() > 0)
                .map(RepaymentSchedule::getDueDate).filter(date -> date.isBefore(asOf)).min(LocalDate::compareTo)
                .orElse(null);
        int days = oldest == null ? 0 : Math.toIntExact(ChronoUnit.DAYS.between(oldest, asOf));
        String classification; BigDecimal rate;
        if (days >= setting.getLossDays()) { classification = "LOSS"; rate = setting.getLossRate(); }
        else if (days >= setting.getDoubtfulDays()) { classification = "DOUBTFUL"; rate = setting.getDoubtfulRate(); }
        else if (days >= setting.getSubstandardDays()) { classification = "SUBSTANDARD"; rate = setting.getSubstandardRate(); }
        else if (days >= setting.getWatchlistDays() && oldest != null) { classification = "WATCHLIST"; rate = setting.getWatchlistRate(); }
        else { classification = "PASS"; rate = setting.getPassRate(); }
        BigDecimal principal = Money.round(outstanding);
        BigDecimal required = Money.round(principal.multiply(rate).divide(new BigDecimal("100")));
        return new Assessment(oldest, days, classification, principal, rate, required);
    }

    private BigDecimal ratio(BigDecimal numerator, BigDecimal denominator) {
        if (denominator.signum() == 0) return Money.ZERO;
        return numerator.multiply(new BigDecimal("100")).divide(denominator, 2, RoundingMode.HALF_UP);
    }

    private void validate(RiskSettingsInput value) {
        if (value == null || value.watchlistDays() < 0 || value.watchlistDays() >= value.substandardDays()
                || value.substandardDays() >= value.doubtfulDays() || value.doubtfulDays() >= value.lossDays()) {
            throw new IllegalArgumentException("Risk thresholds must be strictly increasing");
        }
        for (BigDecimal rate : List.of(value.passRate(), value.watchlistRate(), value.substandardRate(),
                value.doubtfulRate(), value.lossRate())) {
            if (rate == null || rate.signum() < 0 || rate.compareTo(new BigDecimal("100")) > 0) {
                throw new IllegalArgumentException("Provision rates must be between 0 and 100");
            }
        }
    }

    public record RiskSettingsInput(int watchlistDays, int substandardDays, int doubtfulDays, int lossDays,
            BigDecimal passRate, BigDecimal watchlistRate, BigDecimal substandardRate,
            BigDecimal doubtfulRate, BigDecimal lossRate) {}
    record Assessment(LocalDate oldestOverdueDate, int daysPastDue, String classification,
            BigDecimal outstandingPrincipal, BigDecimal provisionRate, BigDecimal requiredProvision) {}
    public record RiskRow(Long loanId, Long memberId, String memberName, String productName,
            LocalDate oldestOverdueDate, int daysPastDue, String classification,
            BigDecimal outstandingPrincipal, BigDecimal provisionRate, BigDecimal requiredProvision) {}
    public record RiskReport(LocalDate asOf, BigDecimal totalOutstanding, BigDecimal requiredProvision,
            BigDecimal npaRatio, BigDecimal par30, BigDecimal par60, BigDecimal par90, List<RiskRow> rows) {}
}
