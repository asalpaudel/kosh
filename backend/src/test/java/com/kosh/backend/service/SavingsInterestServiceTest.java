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

import com.kosh.backend.calendar.BikramSambatCalendar;
import com.kosh.backend.ledger.Accounts;
import com.kosh.backend.ledger.LedgerService;
import com.kosh.backend.model.JournalEntry;
import com.kosh.backend.model.Network;
import com.kosh.backend.model.SavingAccount;
import com.kosh.backend.model.SavingAccountApplication;
import com.kosh.backend.model.SavingsInterestAccrual;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.JournalLineRepository;
import com.kosh.backend.repository.SavingAccountApplicationRepository;
import com.kosh.backend.repository.SavingsInterestAccrualRepository;

@ExtendWith(MockitoExtension.class)
class SavingsInterestServiceTest {
    @Mock SavingAccountApplicationRepository applications;
    @Mock SavingsInterestAccrualRepository accruals;
    @Mock JournalLineRepository journalLines;
    @Mock LedgerService ledger;

    private SavingsInterestService service;
    private SavingAccountApplication application;

    @BeforeEach
    void setUp() {
        service = new SavingsInterestService(applications, accruals, journalLines, ledger,
                new BikramSambatCalendar(), new SavingsInterestCalculator());
        Network network = new Network(); network.setId(2L);
        User member = new User(); member.setId(8L); member.setName("Member");
        SavingAccount product = new SavingAccount();
        product.setId(5L); product.setName("Regular savings"); product.setNetwork(network);
        product.setInterestRate(amount("12.00")); product.setMinBalance(amount("0.00"));
        product.setInterestBasis("DAILY_PRODUCT"); product.setCapitalizationFrequency("MONTHLY");
        product.setDayCountConvention("ACTUAL_365");
        application = new SavingAccountApplication();
        application.setId(20L); application.setNetwork(network); application.setUser(member);
        application.setSavingAccount(product);
    }

    @Test
    void dailyAccrualPostsExpenseToMemberSavings() {
        LocalDate date = LocalDate.of(2026, 8, 10);
        when(accruals.findBySavingAccountIdAndMemberIdAndAccrualDate(5L, 8L, date)).thenReturn(Optional.empty());
        when(journalLines.memberOpeningBalance(Accounts.MEMBER_SAVINGS, 8L, date)).thenReturn(amount("36500.00"));
        when(journalLines.memberDailyMovements(Accounts.MEMBER_SAVINGS, 8L, date, date)).thenReturn(List.of());
        when(accruals.findBySavingAccountIdAndMemberIdAndAccrualDateBetweenOrderByAccrualDateAsc(
                eq(5L), eq(8L), any(), eq(date.minusDays(1)))).thenReturn(List.of());
        when(ledger.post(any(), eq(date), any(), any(), eq("SAVINGS_INTEREST"), eq(20L), any(), any()))
                .thenReturn(new JournalEntry());
        when(accruals.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        SavingsInterestAccrual result = service.accrue(application, date, "System close");

        assertThat(result.getBasisAmount()).isEqualByComparingTo("36500.00");
        assertThat(result.getAccruedAmount()).isEqualByComparingTo("12.00");
        assertThat(result.getJournalEntry()).isNotNull();
    }

    @Test
    void monthlyCapitalizationExcludesEarlierUncapitalizedInterestFromBasis() {
        LocalDate date = LocalDate.of(2026, 8, 10);
        when(accruals.findBySavingAccountIdAndMemberIdAndAccrualDate(5L, 8L, date)).thenReturn(Optional.empty());
        when(journalLines.memberOpeningBalance(Accounts.MEMBER_SAVINGS, 8L, date)).thenReturn(amount("1010.00"));
        when(journalLines.memberDailyMovements(Accounts.MEMBER_SAVINGS, 8L, date, date)).thenReturn(List.of());
        SavingsInterestAccrual prior = new SavingsInterestAccrual();
        prior.setAccrualDate(date.minusDays(1)); prior.setAccruedAmount(amount("10.00"));
        when(accruals.findBySavingAccountIdAndMemberIdAndAccrualDateBetweenOrderByAccrualDateAsc(
                eq(5L), eq(8L), any(), eq(date.minusDays(1)))).thenReturn(List.of(prior));
        when(ledger.post(any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(new JournalEntry());
        when(accruals.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        SavingsInterestAccrual result = service.accrue(application, date, "System close");

        assertThat(result.getBasisAmount()).isEqualByComparingTo("1000.00");
    }

    @Test
    void existingProductMemberDateKeyPreventsDoublePosting() {
        LocalDate date = LocalDate.of(2026, 8, 10);
        SavingsInterestAccrual existing = new SavingsInterestAccrual();
        when(accruals.findBySavingAccountIdAndMemberIdAndAccrualDate(5L, 8L, date))
                .thenReturn(Optional.of(existing));

        assertThat(service.accrue(application, date, "System close")).isSameAs(existing);
        verify(ledger, never()).post(any(), any(), any(), any(), any(), any(), any(), any());
    }

    private BigDecimal amount(String value) { return new BigDecimal(value); }
}
