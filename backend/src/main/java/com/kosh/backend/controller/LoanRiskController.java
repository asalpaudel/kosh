package com.kosh.backend.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.function.Supplier;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.kosh.backend.model.LoanRiskSetting;
import com.kosh.backend.model.Network;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.service.LoanRiskService;
import com.kosh.backend.service.LoanRiskService.RiskSettingsInput;
import com.kosh.backend.service.NetworkAccessService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/loan-risk")
public class LoanRiskController {
    private final LoanRiskService risk;
    private final NetworkRepository networks;
    private final NetworkAccessService access;

    public LoanRiskController(LoanRiskService risk, NetworkRepository networks, NetworkAccessService access) {
        this.risk = risk; this.networks = networks; this.access = access;
    }

    @GetMapping("/network/{networkId}/settings")
    public ResponseEntity<?> settings(@PathVariable Long networkId, HttpSession session) {
        Network network = authorisedNetwork(networkId, session);
        if (network == null) return access.canViewNetwork(networkId, session) ? ResponseEntity.notFound().build() : forbidden();
        return execute(() -> view(risk.settings(network)));
    }

    @PutMapping("/network/{networkId}/settings")
    public ResponseEntity<?> updateSettings(@PathVariable Long networkId, @RequestBody RiskSettingsInput input,
            HttpSession session) {
        Network network = authorisedNetwork(networkId, session);
        if (network == null) return access.canViewNetwork(networkId, session) ? ResponseEntity.notFound().build() : forbidden();
        return execute(() -> view(risk.updateSettings(network, input)));
    }

    @GetMapping("/network/{networkId}/report")
    public ResponseEntity<?> report(@PathVariable Long networkId,
            @RequestParam(value = "asOf", required = false) LocalDate asOf, HttpSession session) {
        Network network = authorisedNetwork(networkId, session);
        if (network == null) return access.canViewNetwork(networkId, session) ? ResponseEntity.notFound().build() : forbidden();
        return execute(() -> risk.report(network, asOf == null ? LocalDate.now() : asOf));
    }

    private Network authorisedNetwork(Long networkId, HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) return null;
        return networks.findById(networkId).orElse(null);
    }

    private SettingsView view(LoanRiskSetting value) {
        return new SettingsView(value.getWatchlistDays(), value.getSubstandardDays(), value.getDoubtfulDays(),
                value.getLossDays(), value.getPassRate(), value.getWatchlistRate(), value.getSubstandardRate(),
                value.getDoubtfulRate(), value.getLossRate());
    }

    private ResponseEntity<?> execute(Supplier<Object> action) {
        try { return ResponseEntity.ok(action.get()); }
        catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        }
    }

    private ResponseEntity<Map<String, String>> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Cross-tenant access denied"));
    }

    public record SettingsView(int watchlistDays, int substandardDays, int doubtfulDays, int lossDays,
            BigDecimal passRate, BigDecimal watchlistRate, BigDecimal substandardRate,
            BigDecimal doubtfulRate, BigDecimal lossRate) {}
}
