package com.kosh.backend.controller;

import java.time.LocalDate;
import java.util.Map;
import java.util.function.Supplier;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosh.backend.model.AccountingPeriod;
import com.kosh.backend.model.Network;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.service.CloseService;
import com.kosh.backend.service.CloseService.CloseType;
import com.kosh.backend.service.NetworkAccessService;
import com.kosh.backend.service.CheckpointPublicationService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/close")
public class CloseController {
    private final CloseService closeService;
    private final NetworkRepository networks;
    private final NetworkAccessService access;
    private final CheckpointPublicationService checkpoints;

    public CloseController(CloseService closeService, NetworkRepository networks, NetworkAccessService access,
            CheckpointPublicationService checkpoints) {
        this.closeService = closeService;
        this.networks = networks;
        this.access = access;
        this.checkpoints = checkpoints;
    }

    @PostMapping("/network/{networkId}/run")
    public ResponseEntity<?> close(@PathVariable Long networkId, @RequestBody CloseRequest request,
            HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) return forbidden();
        Network network = networks.findById(networkId).orElse(null);
        if (network == null) return ResponseEntity.notFound().build();
        return execute(() -> {
            var result = closeService.close(network, request.processingDate(), request.closeType(), actor(session));
            if (request.closeType() == CloseType.MONTH_END) checkpoints.publish(network, request.processingDate());
            return new CloseView(periodView(result.period()), result.alreadyProcessed(), result.tasksExecuted());
        });
    }

    @GetMapping("/network/{networkId}/periods")
    public ResponseEntity<?> periods(@PathVariable Long networkId, HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) return forbidden();
        return execute(() -> closeService.periods(networkId).stream().map(this::periodView).toList());
    }

    @PostMapping("/network/{networkId}/periods/{periodId}/reopen")
    public ResponseEntity<?> reopen(@PathVariable Long networkId, @PathVariable Long periodId,
            @RequestBody ReopenRequest request, HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) return forbidden();
        Network network = networks.findById(networkId).orElse(null);
        if (network == null) return ResponseEntity.notFound().build();
        return execute(() -> periodView(closeService.reopen(network, periodId, request.reason(), actor(session))));
    }

    private PeriodView periodView(AccountingPeriod period) {
        return new PeriodView(period.getId(), period.getPeriodType(), period.getPeriodStart(), period.getPeriodEnd(),
                period.getClosedAt(), period.getClosedBy(), period.getReopenedAt(), period.getReopenedBy(),
                period.getReopenReason(), period.getReopenedAt() == null ? "CLOSED" : "REOPENED");
    }

    private ResponseEntity<?> execute(Supplier<Object> action) {
        try { return ResponseEntity.ok(action.get()); }
        catch (IllegalArgumentException | IllegalStateException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        }
    }

    private String actor(HttpSession session) {
        return (String) session.getAttribute("userName");
    }

    private ResponseEntity<Map<String, String>> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Cross-tenant access denied"));
    }

    public record CloseRequest(LocalDate processingDate, CloseType closeType) {}
    public record ReopenRequest(String reason) {}
    public record CloseView(PeriodView period, boolean alreadyProcessed, int tasksExecuted) {}
    public record PeriodView(Long id, String periodType, LocalDate periodStart, LocalDate periodEnd,
            java.time.Instant closedAt, String closedBy, java.time.Instant reopenedAt, String reopenedBy,
            String reopenReason, String status) {}
}
