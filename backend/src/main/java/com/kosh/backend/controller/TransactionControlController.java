package com.kosh.backend.controller;

import java.math.BigDecimal;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosh.backend.model.Network;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.service.Money;
import com.kosh.backend.service.NetworkAccessService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/transaction-controls")
public class TransactionControlController {
    private final NetworkRepository networks;
    private final NetworkAccessService access;
    public TransactionControlController(NetworkRepository networks, NetworkAccessService access) {
        this.networks = networks; this.access = access;
    }

    @GetMapping("/network/{networkId}")
    public ResponseEntity<?> get(@PathVariable Long networkId, HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) return forbidden();
        Network network = networks.findById(networkId).orElse(null);
        return network == null ? ResponseEntity.notFound().build()
                : ResponseEntity.ok(Map.of("makerCheckerThreshold", network.getMakerCheckerThreshold()));
    }

    @PutMapping("/network/{networkId}")
    @Transactional
    public ResponseEntity<?> update(@PathVariable Long networkId, @RequestBody ThresholdRequest request,
            HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) return forbidden();
        if (request.makerCheckerThreshold() == null || request.makerCheckerThreshold().signum() < 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Maker-checker threshold cannot be negative"));
        }
        networks.lockForPosting(networkId);
        Network network = networks.findById(networkId).orElse(null);
        if (network == null) return ResponseEntity.notFound().build();
        network.setMakerCheckerThreshold(Money.round(request.makerCheckerThreshold())); networks.save(network);
        return ResponseEntity.ok(Map.of("makerCheckerThreshold", network.getMakerCheckerThreshold()));
    }

    private ResponseEntity<Map<String, String>> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Cross-tenant access denied"));
    }
    public record ThresholdRequest(BigDecimal makerCheckerThreshold) {}
}
