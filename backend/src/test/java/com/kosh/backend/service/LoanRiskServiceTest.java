package com.kosh.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.kosh.backend.ledger.LedgerService;
import com.kosh.backend.model.ApplicationStatus;
import com.kosh.backend.model.JournalEntry;
import com.kosh.backend.model.LoanApplication;
import com.kosh.backend.model.LoanClassification;
import com.kosh.backend.model.LoanPackage;
import com.kosh.backend.model.LoanRiskSetting;
import com.kosh.backend.model.Network;
import com.kosh.backend.model.RepaymentSchedule;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.LoanApplicationRepository;
import com.kosh.backend.repository.LoanClassificationRepository;
import com.kosh.backend.repository.LoanRiskSettingRepository;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.repository.RepaymentScheduleRepository;

@ExtendWith(MockitoExtension.class)
class LoanRiskServiceTest {
    @Mock LoanRiskSettingRepository settings;
    @Mock LoanClassificationRepository classifications;
    @Mock LoanApplicationRepository loans;
    @Mock RepaymentScheduleRepository schedules;
    @Mock NetworkRepository networks;
    @Mock LedgerService ledger;

    private LoanRiskService service;
    private Network network;
    private LoanRiskSetting setting;

    @BeforeEach
    void setUp() {
        service = new LoanRiskService(settings, classifications, loans, schedules, networks, ledger);
        network = new Network(); network.setId(2L);
        setting = new LoanRiskSetting(); setting.setNetwork(network);
    }

    @Test
    void classificationUsesOldestOverdueInstallmentAndConfiguredThresholds() {
        LoanApplication loan = loan(5L, "100.00");
        LocalDate asOf = LocalDate.of(2026, 8, 11);
        when(schedules.findByLoanApplicationIdOrderByDueDateAsc(5L)).thenReturn(List.of(
                installment(asOf.minusDays(95), "40.00"), installment(asOf.minusDays(35), "60.00")));

        var result = service.assess(loan, asOf, setting);

        assertThat(result.daysPastDue()).isEqualTo(95);
        assertThat(result.classification()).isEqualTo("DOUBTFUL");
        assertThat(result.outstandingPrincipal()).isEqualByComparingTo("100.00");
        assertThat(result.requiredProvision()).isEqualByComparingTo("50.00");
    }

    @Test
    void classificationPostsOnlyTheProvisionDelta() {
        LoanApplication loan = loan(5L, "100.00"); loan.setProvisionBalance(amount("10.00"));
        LocalDate asOf = LocalDate.of(2026, 8, 11);
        when(classifications.findByLoanApplicationIdAndClassificationDate(5L, asOf)).thenReturn(Optional.empty());
        when(schedules.findByLoanApplicationIdOrderByDueDateAsc(5L))
                .thenReturn(List.of(installment(asOf.minusDays(40), "100.00")));
        when(ledger.post(any(), eq(asOf), any(), any(), eq("LOAN_PROVISION"), eq(5L), any(), any()))
                .thenReturn(new JournalEntry());
        when(classifications.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        LoanClassification result = service.classify(loan, asOf, "Close", setting);

        assertThat(result.getClassification()).isEqualTo("SUBSTANDARD");
        assertThat(result.getRequiredProvision()).isEqualByComparingTo("25.00");
        assertThat(result.getProvisionChange()).isEqualByComparingTo("15.00");
        assertThat(loan.getProvisionBalance()).isEqualByComparingTo("25.00");
    }

    @Test
    void dailyKeyReturnsExistingClassificationWithoutPostingAgain() {
        LocalDate asOf = LocalDate.of(2026, 8, 11); LoanClassification existing = new LoanClassification();
        when(classifications.findByLoanApplicationIdAndClassificationDate(5L, asOf))
                .thenReturn(Optional.of(existing));

        assertThat(service.classify(loan(5L, "100.00"), asOf, "Close", setting)).isSameAs(existing);
        verify(ledger, never()).post(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void reportCalculatesNpaAndPortfolioAtRiskRatios() {
        LocalDate asOf = LocalDate.of(2026, 8, 11);
        LoanApplication doubtful = loan(5L, "100.00"); LoanApplication current = loan(6L, "100.00");
        when(settings.findByNetworkId(2L)).thenReturn(Optional.of(setting));
        when(loans.findByNetworkIdAndStatusOrderByIdAsc(2L, ApplicationStatus.APPROVED))
                .thenReturn(List.of(doubtful, current));
        when(schedules.findByLoanApplicationIdOrderByDueDateAsc(5L))
                .thenReturn(List.of(installment(asOf.minusDays(100), "100.00")));
        when(schedules.findByLoanApplicationIdOrderByDueDateAsc(6L))
                .thenReturn(List.of(installment(asOf.plusDays(10), "100.00")));

        var report = service.report(network, asOf);

        assertThat(report.npaRatio()).isEqualByComparingTo("50.00");
        assertThat(report.par30()).isEqualByComparingTo("50.00");
        assertThat(report.par60()).isEqualByComparingTo("50.00");
        assertThat(report.par90()).isEqualByComparingTo("50.00");
    }

    private LoanApplication loan(Long id, String amount) {
        User member = new User(); member.setId(id + 10); member.setName("Member " + id);
        LoanPackage product = new LoanPackage(); product.setName("Loan product");
        LoanApplication value = new LoanApplication(); value.setId(id); value.setNetwork(network);
        value.setUser(member); value.setLoanPackage(product); value.setApprovedAmount(amount(amount));
        return value;
    }

    private RepaymentSchedule installment(LocalDate dueDate, String principal) {
        RepaymentSchedule value = new RepaymentSchedule(); value.setDueDate(dueDate);
        value.setPrincipalAmount(amount(principal)); value.setPrincipalPaid(Money.ZERO);
        value.setInterestAmount(Money.ZERO); value.setInterestPaid(Money.ZERO); return value;
    }

    private BigDecimal amount(String value) { return new BigDecimal(value); }
}
