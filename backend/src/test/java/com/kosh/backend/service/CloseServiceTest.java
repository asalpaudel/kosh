package com.kosh.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.kosh.backend.calendar.BikramSambatCalendar;
import com.kosh.backend.calendar.BsDate;
import com.kosh.backend.model.AccountingPeriod;
import com.kosh.backend.model.ActivityLog;
import com.kosh.backend.model.Network;
import com.kosh.backend.model.ProcessingDateLock;
import com.kosh.backend.repository.AccountingPeriodRepository;
import com.kosh.backend.repository.ActivityLogRepository;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.repository.ProcessingDateLockRepository;
import com.kosh.backend.service.CloseService.CloseType;

@ExtendWith(MockitoExtension.class)
class CloseServiceTest {
    @Mock ProcessingDateLockRepository locks;
    @Mock AccountingPeriodRepository periods;
    @Mock NetworkRepository networks;
    @Mock ActivityLogRepository activityLogs;
    @Mock CloseTask task;

    private CloseService service;
    private Network network;

    @BeforeEach
    void setUp() {
        service = new CloseService(locks, periods, networks, activityLogs,
                new BikramSambatCalendar(), List.of(task));
        network = new Network();
        network.setId(3L);
        network.setName("Cooperative");
    }

    @Test
    void dayEndAcquiresOneLockRunsTasksAndClosesDate() {
        LocalDate date = LocalDate.of(2026, 8, 10);
        ProcessingDateLock lock = lock(7L);
        when(locks.tryAcquire(3L, "DAY_END", date, "NETWORK")).thenReturn(1);
        when(locks.findByNetworkIdAndProcessTypeAndProcessingDateAndScopeKey(3L, "DAY_END", date, "NETWORK"))
                .thenReturn(Optional.of(lock));
        when(periods.findByNetworkIdAndPeriodTypeAndPeriodStartAndPeriodEnd(3L, "DAY_END", date, date))
                .thenReturn(Optional.empty());
        when(task.supports(CloseType.DAY_END)).thenReturn(true);
        when(periods.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(locks.complete(any(), any(), any())).thenReturn(1);

        var result = service.close(network, date, CloseType.DAY_END, "Admin");

        assertThat(result.alreadyProcessed()).isFalse();
        assertThat(result.tasksExecuted()).isEqualTo(1);
        assertThat(result.period().getPeriodStart()).isEqualTo(date);
        assertThat(result.period().getPeriodEnd()).isEqualTo(date);
        verify(task).execute(network, date);
        verify(activityLogs).save(any(ActivityLog.class));
    }

    @Test
    void repeatedCloseReturnsExistingResultWithoutRunningTasks() {
        LocalDate date = LocalDate.of(2026, 8, 10);
        ProcessingDateLock lock = lock(7L);
        AccountingPeriod period = period(date, date);
        when(locks.tryAcquire(3L, "DAY_END", date, "NETWORK")).thenReturn(0);
        when(locks.findByNetworkIdAndProcessTypeAndProcessingDateAndScopeKey(3L, "DAY_END", date, "NETWORK"))
                .thenReturn(Optional.of(lock));
        when(periods.findByNetworkIdAndPeriodTypeAndPeriodStartAndPeriodEnd(3L, "DAY_END", date, date))
                .thenReturn(Optional.of(period));

        var result = service.close(network, date, CloseType.DAY_END, "Admin");

        assertThat(result.alreadyProcessed()).isTrue();
        verify(task, never()).execute(any(), any());
    }

    @Test
    void monthEndUsesActualBsMonthBoundary() {
        BikramSambatCalendar calendar = new BikramSambatCalendar();
        int lastDay = calendar.daysInMonth(2082, 12);
        LocalDate monthEnd = calendar.toAd(new BsDate(2082, 12, lastDay));

        assertThatThrownBy(() -> service.close(network, monthEnd.minusDays(1), CloseType.MONTH_END, "Admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("final day of the BS month");
        verify(locks, never()).tryAcquire(any(), any(), any(), any());
    }

    @Test
    void reopenRequiresMeaningfulReasonAndPersistsAudit() {
        AccountingPeriod period = period(LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 10));
        period.setId(12L);
        when(periods.findByIdAndNetworkId(12L, 3L)).thenReturn(Optional.of(period));
        when(periods.save(period)).thenReturn(period);

        assertThatThrownBy(() -> service.reopen(network, 12L, "short", "Admin"))
                .isInstanceOf(IllegalArgumentException.class);
        AccountingPeriod reopened = service.reopen(network, 12L, "Correct back-dated teller error", "Admin");

        assertThat(reopened.getReopenedAt()).isNotNull();
        assertThat(reopened.getReopenReason()).isEqualTo("Correct back-dated teller error");
        verify(activityLogs).save(any(ActivityLog.class));
    }

    private ProcessingDateLock lock(Long id) {
        ProcessingDateLock value = new ProcessingDateLock();
        value.setId(id);
        return value;
    }

    private AccountingPeriod period(LocalDate start, LocalDate end) {
        AccountingPeriod value = new AccountingPeriod();
        value.setNetwork(network);
        value.setPeriodType("DAY_END");
        value.setPeriodStart(start);
        value.setPeriodEnd(end);
        value.setClosedAt(java.time.Instant.now());
        value.setClosedBy("Admin");
        return value;
    }
}
