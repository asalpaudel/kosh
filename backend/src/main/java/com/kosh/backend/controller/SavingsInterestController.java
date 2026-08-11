package com.kosh.backend.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosh.backend.model.SavingsInterestAccrual;
import com.kosh.backend.service.NetworkAccessService;
import com.kosh.backend.service.SavingsInterestService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/interest")
public class SavingsInterestController {
    private final SavingsInterestService interest;
    private final NetworkAccessService access;

    public SavingsInterestController(SavingsInterestService interest, NetworkAccessService access) {
        this.interest = interest;
        this.access = access;
    }

    @GetMapping("/network/{networkId}/accruals")
    public ResponseEntity<?> accruals(@PathVariable Long networkId, HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Cross-tenant access denied"));
        }
        return ResponseEntity.ok(interest.history(networkId).stream().map(this::view).toList());
    }

    private AccrualView view(SavingsInterestAccrual value) {
        return new AccrualView(value.getId(), value.getAccrualDate(), value.getSavingAccount().getId(),
                value.getSavingAccount().getName(), value.getMember().getId(), value.getMember().getName(),
                value.getInterestBasis(), value.getCapitalizationFrequency(), value.getDayCountConvention(),
                value.getBasisAmount(), value.getAnnualRate(), value.getAccruedAmount(),
                value.getJournalEntry() == null ? null : value.getJournalEntry().getId());
    }

    public record AccrualView(Long id, LocalDate accrualDate, Long productId, String productName,
            Long memberId, String memberName, String interestBasis, String capitalizationFrequency,
            String dayCountConvention, BigDecimal basisAmount, BigDecimal annualRate,
            BigDecimal accruedAmount, Long journalEntryId) {}
}
