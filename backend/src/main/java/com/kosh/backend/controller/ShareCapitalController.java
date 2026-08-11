package com.kosh.backend.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosh.backend.model.Network;
import com.kosh.backend.model.ShareCertificate;
import com.kosh.backend.model.ShareSettings;
import com.kosh.backend.model.ShareTransaction;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.service.Money;
import com.kosh.backend.service.NetworkAccessService;
import com.kosh.backend.service.ShareCapitalService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/shares")
public class ShareCapitalController {
    private final ShareCapitalService shares;
    private final NetworkRepository networks;
    private final NetworkAccessService access;

    public ShareCapitalController(ShareCapitalService shares, NetworkRepository networks,
            NetworkAccessService access) {
        this.shares = shares;
        this.networks = networks;
        this.access = access;
    }

    @GetMapping("/network/{networkId}/settings")
    public ResponseEntity<?> settings(@PathVariable Long networkId, HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) return forbidden();
        return execute(() -> settingsView(shares.getSettings(networkId)));
    }

    @PutMapping("/network/{networkId}/settings")
    public ResponseEntity<?> updateSettings(@PathVariable Long networkId, @RequestBody SettingsRequest request,
            HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) return forbidden();
        Network network = networks.findById(networkId).orElse(null);
        if (network == null) return ResponseEntity.notFound().build();
        return execute(() -> settingsView(shares.updateSettings(network, Money.of(request.unitPrice()),
                request.minimumShares(), request.statutoryMaxShares())));
    }

    @GetMapping("/network/{networkId}/register")
    public ResponseEntity<?> register(@PathVariable Long networkId, HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) return forbidden();
        return execute(() -> shares.register(networkId).stream().map(this::certificateView).toList());
    }

    @GetMapping("/network/{networkId}/transactions")
    public ResponseEntity<?> transactions(@PathVariable Long networkId, HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) return forbidden();
        return execute(() -> shares.transactions(networkId).stream().map(this::transactionView).toList());
    }

    @PostMapping("/network/{networkId}/purchase")
    public ResponseEntity<?> purchase(@PathVariable Long networkId, @RequestBody PurchaseRequest request,
            HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) return forbidden();
        Network network = networks.findById(networkId).orElse(null);
        if (network == null) return ResponseEntity.notFound().build();
        return execute(() -> transactionView(shares.additionalPurchase(network, request.memberId(), request.shareCount(),
                request.paymentMethod(), request.date(), request.requestRef(), actor(session))));
    }

    @PostMapping("/network/{networkId}/transfer")
    public ResponseEntity<?> transfer(@PathVariable Long networkId, @RequestBody TransferRequest request,
            HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) return forbidden();
        Network network = networks.findById(networkId).orElse(null);
        if (network == null) return ResponseEntity.notFound().build();
        return execute(() -> transactionView(shares.transfer(network, request.fromMemberId(), request.toMemberId(),
                request.shareCount(), request.date(), request.requestRef(), actor(session))));
    }

    @PostMapping("/network/{networkId}/refund")
    public ResponseEntity<?> refund(@PathVariable Long networkId, @RequestBody RefundRequest request,
            HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) return forbidden();
        Network network = networks.findById(networkId).orElse(null);
        if (network == null) return ResponseEntity.notFound().build();
        return execute(() -> transactionView(shares.refundOnExit(network, request.memberId(), request.paymentMethod(),
                request.date(), request.requestRef(), actor(session))));
    }

    @GetMapping("/me/certificate")
    public ResponseEntity<?> myCertificate(HttpSession session) {
        Long networkId = (Long) session.getAttribute("sahakariId");
        Long memberId = (Long) session.getAttribute("userId");
        if (!access.canViewNetwork(networkId, session) || memberId == null) return forbidden();
        return execute(() -> certificateView(shares.certificate(networkId, memberId)));
    }

    @GetMapping("/me/transactions")
    public ResponseEntity<?> myTransactions(HttpSession session) {
        Long networkId = (Long) session.getAttribute("sahakariId");
        Long memberId = (Long) session.getAttribute("userId");
        if (!access.canViewNetwork(networkId, session) || memberId == null) return forbidden();
        return execute(() -> shares.memberTransactions(networkId, memberId).stream()
                .map(this::transactionView).toList());
    }

    private SettingsView settingsView(ShareSettings value) {
        return new SettingsView(value.getUnitPrice(), value.getMinimumShares(), value.getStatutoryMaxShares());
    }

    private CertificateView certificateView(ShareCertificate value) {
        return new CertificateView(value.getId(), value.getCertificateNumber(), value.getMember().getId(),
                value.getMember().getName(), value.getSharesHeld(), value.getIssuedDate(), value.getStatus());
    }

    private TransactionView transactionView(ShareTransaction value) {
        return new TransactionView(value.getId(), value.getTransactionNumber(), value.getTransactionType(),
                value.getFromMember() == null ? null : value.getFromMember().getId(),
                value.getFromMember() == null ? null : value.getFromMember().getName(),
                value.getToMember() == null ? null : value.getToMember().getId(),
                value.getToMember() == null ? null : value.getToMember().getName(),
                value.getShareCount(), value.getUnitPrice(), value.getTotalAmount(), value.getTransactionDate(),
                value.getJournalEntry().getSequenceNo(), value.getNarration(), value.getCreatedBy());
    }

    private ResponseEntity<?> execute(Supplier<Object> operation) {
        try {
            return ResponseEntity.ok(operation.get());
        } catch (IllegalArgumentException | IllegalStateException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        }
    }

    private String actor(HttpSession session) {
        String name = (String) session.getAttribute("userName");
        return name == null || name.isBlank() ? "Cooperative administrator" : name;
    }

    private ResponseEntity<Map<String, String>> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Cross-tenant access denied"));
    }

    public record SettingsRequest(Object unitPrice, int minimumShares, int statutoryMaxShares) {}
    public record PurchaseRequest(Long memberId, int shareCount, String paymentMethod, LocalDate date, String requestRef) {}
    public record TransferRequest(Long fromMemberId, Long toMemberId, int shareCount, LocalDate date, String requestRef) {}
    public record RefundRequest(Long memberId, String paymentMethod, LocalDate date, String requestRef) {}
    public record SettingsView(BigDecimal unitPrice, int minimumShares, int statutoryMaxShares) {}
    public record CertificateView(Long id, String certificateNumber, Long memberId, String memberName,
            int sharesHeld, LocalDate issuedDate, String status) {}
    public record TransactionView(Long id, String transactionNumber, String transactionType,
            Long fromMemberId, String fromMemberName, Long toMemberId, String toMemberName,
            int shareCount, BigDecimal unitPrice, BigDecimal totalAmount, LocalDate transactionDate,
            long journalSequence, String narration, String createdBy) {}
}
