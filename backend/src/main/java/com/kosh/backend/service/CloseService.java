package com.kosh.backend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

@Service
public class CloseService {
    private static final String NETWORK_SCOPE = "NETWORK";
    private static final ZoneId NEPAL_TIME = ZoneId.of("Asia/Kathmandu");

    public enum CloseType { DAY_END, MONTH_END }

    private final ProcessingDateLockRepository locks;
    private final AccountingPeriodRepository periods;
    private final NetworkRepository networks;
    private final ActivityLogRepository activityLogs;
    private final BikramSambatCalendar calendar;
    private final List<CloseTask> tasks;

    public CloseService(ProcessingDateLockRepository locks, AccountingPeriodRepository periods,
            NetworkRepository networks, ActivityLogRepository activityLogs,
            BikramSambatCalendar calendar, List<CloseTask> tasks) {
        this.locks = locks;
        this.periods = periods;
        this.networks = networks;
        this.activityLogs = activityLogs;
        this.calendar = calendar;
        this.tasks = tasks;
    }

    @Transactional
    public CloseResult close(Network network, LocalDate processingDate, CloseType type, String actor) {
        if (network == null || processingDate == null || type == null) {
            throw new IllegalArgumentException("Cooperative, processing date, and close type are required");
        }
        if (processingDate.isAfter(LocalDate.now(NEPAL_TIME))) {
            throw new IllegalArgumentException("A future processing date cannot be closed");
        }
        PeriodRange range = range(processingDate, type);
        String actorName = actor(actor);
        networks.lockForPosting(network.getId());
        int acquired = locks.tryAcquire(network.getId(), type.name(), processingDate, NETWORK_SCOPE);
        AccountingPeriod period = periods.findByNetworkIdAndPeriodTypeAndPeriodStartAndPeriodEnd(
                network.getId(), type.name(), range.start(), range.end()).orElse(null);

        if (acquired == 0) {
            ProcessingDateLock existing = locks.findByNetworkIdAndProcessTypeAndProcessingDateAndScopeKey(
                    network.getId(), type.name(), processingDate, NETWORK_SCOPE)
                    .orElseThrow(() -> new IllegalStateException("Close lock exists but cannot be read"));
            if (period == null) {
                throw new IllegalStateException("Completed close has no accounting period");
            }
            if (period != null && period.getReopenedAt() != null) {
                closePeriod(period, actorName);
                activityLogs.save(log(network, actorName, "RECLOSE_PERIOD",
                        type.name() + " reclosed through " + processingDate));
            }
            return new CloseResult(period, existing, true, 0);
        }

        ProcessingDateLock lock = locks.findByNetworkIdAndProcessTypeAndProcessingDateAndScopeKey(
                network.getId(), type.name(), processingDate, NETWORK_SCOPE)
                .orElseThrow(() -> new IllegalStateException("Acquired close lock cannot be read"));
        int taskCount = 0;
        for (CloseTask task : tasks) {
            if (!task.supports(type)) continue;
            task.execute(network, processingDate);
            taskCount++;
        }
        if (period == null) {
            period = new AccountingPeriod();
            period.setNetwork(network);
            period.setPeriodType(type.name());
            period.setPeriodStart(range.start());
            period.setPeriodEnd(range.end());
        }
        closePeriod(period, actorName);
        period = periods.save(period);
        if (locks.complete(lock.getId(), Instant.now(), actorName) != 1) {
            throw new IllegalStateException("Close completion lock was lost");
        }
        lock.setCompletedAt(Instant.now());
        lock.setCompletedBy(actorName);
        activityLogs.save(log(network, actorName, "CLOSE_" + type.name(),
                type.name() + " completed through " + processingDate));
        return new CloseResult(period, lock, false, taskCount);
    }

    @Transactional
    public AccountingPeriod reopen(Network network, Long periodId, String reason, String actor) {
        if (reason == null || reason.isBlank() || reason.trim().length() < 8 || reason.length() > 500) {
            throw new IllegalArgumentException("A reopen reason of 8 to 500 characters is required");
        }
        networks.lockForPosting(network.getId());
        AccountingPeriod period = periods.findByIdAndNetworkId(periodId, network.getId())
                .orElseThrow(() -> new IllegalArgumentException("Accounting period not found"));
        if (period.getReopenedAt() != null) return period;
        String actorName = actor(actor);
        period.setReopenedAt(Instant.now());
        period.setReopenedBy(actorName);
        period.setReopenReason(reason.trim());
        AccountingPeriod saved = periods.save(period);
        activityLogs.save(log(network, actorName, "REOPEN_PERIOD",
                period.getPeriodType() + " through " + period.getPeriodEnd() + ": " + reason.trim()));
        return saved;
    }

    @Transactional(readOnly = true)
    public List<AccountingPeriod> periods(Long networkId) {
        return periods.findByNetworkIdOrderByPeriodEndDescIdDesc(networkId);
    }

    private PeriodRange range(LocalDate processingDate, CloseType type) {
        if (type == CloseType.DAY_END) return new PeriodRange(processingDate, processingDate);
        BsDate bs = calendar.toBs(processingDate);
        int lastDay = calendar.daysInMonth(bs.year(), bs.month());
        if (bs.day() != lastDay) {
            throw new IllegalArgumentException("Month-end must use the final day of the BS month");
        }
        return new PeriodRange(calendar.toAd(new BsDate(bs.year(), bs.month(), 1)), processingDate);
    }

    private void closePeriod(AccountingPeriod period, String actor) {
        period.setClosedAt(Instant.now());
        period.setClosedBy(actor);
        period.setReopenedAt(null);
        period.setReopenedBy(null);
        period.setReopenReason(null);
    }

    private ActivityLog log(Network network, String actor, String action, String details) {
        return new ActivityLog(actor, "admin", network.getId(), action,
                details.length() > 255 ? details.substring(0, 255) : details);
    }

    private String actor(String actor) {
        return actor == null || actor.isBlank() ? "Cooperative administrator" : actor;
    }

    private record PeriodRange(LocalDate start, LocalDate end) {}
    public record CloseResult(AccountingPeriod period, ProcessingDateLock lock,
            boolean alreadyProcessed, int tasksExecuted) {}
}
