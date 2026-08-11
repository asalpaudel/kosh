package com.kosh.backend.controller;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosh.backend.model.LoanCollateral;
import com.kosh.backend.model.LoanGuarantor;
import com.kosh.backend.service.LoanSecurityService;
import com.kosh.backend.service.NetworkAccessService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/loan-security")
public class LoanSecurityController {
    private final LoanSecurityService security;
    private final NetworkAccessService access;

    public LoanSecurityController(LoanSecurityService security, NetworkAccessService access) {
        this.security = security;
        this.access = access;
    }

    @GetMapping("/network/{networkId}/collateral-register")
    public ResponseEntity<?> collateralRegister(@PathVariable Long networkId, HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) return forbidden();
        return ResponseEntity.ok(security.collateralRegister(networkId).stream().map(this::view).toList());
    }

    private CollateralView view(LoanCollateral value) {
        var loan = value.getLoanApplication();
        return new CollateralView(value.getId(), loan.getId(), loan.getUser().getId(), loan.getUser().getName(),
                loan.getLoanPackage().getName(), value.getCollateralType(), value.getValuation(),
                value.getValuer(), value.getValuationDate(), value.getDocumentReference(), value.getPlotNumber(),
                value.getArea(), value.getLocation(), value.getOwnershipDocumentReference(), value.getStatus(),
                value.getReleasedAt(), value.getReleasedBy(),
                security.guarantors(loan.getId()).stream().map(this::guarantorView).toList());
    }

    private GuarantorView guarantorView(LoanGuarantor value) {
        return new GuarantorView(value.getGuarantor().getId(), value.getGuarantor().getName(),
                value.getLiabilityAmount(), value.getConsentReference(), value.getConsentedAt(), value.getStatus());
    }

    private ResponseEntity<Map<String, String>> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Cross-tenant access denied"));
    }

    public record GuarantorView(Long memberId, String memberName, BigDecimal liabilityAmount,
            String consentReference, Instant consentedAt, String status) {}
    public record CollateralView(Long id, Long loanApplicationId, Long memberId, String memberName,
            String productName, String collateralType, BigDecimal valuation, String valuer,
            LocalDate valuationDate, String documentReference, String plotNumber, String area,
            String location, String ownershipDocumentReference, String status, Instant releasedAt,
            String releasedBy, java.util.List<GuarantorView> guarantors) {}
}
