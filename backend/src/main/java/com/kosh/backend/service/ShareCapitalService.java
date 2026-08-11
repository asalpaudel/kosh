package com.kosh.backend.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kosh.backend.ledger.LedgerPostings;
import com.kosh.backend.ledger.LedgerService;
import com.kosh.backend.model.ActivityLog;
import com.kosh.backend.model.JournalEntry;
import com.kosh.backend.model.Network;
import com.kosh.backend.model.ShareCertificate;
import com.kosh.backend.model.ShareSettings;
import com.kosh.backend.model.ShareTransaction;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.ActivityLogRepository;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.repository.ShareCertificateRepository;
import com.kosh.backend.repository.ShareSettingsRepository;
import com.kosh.backend.repository.ShareTransactionRepository;
import com.kosh.backend.repository.UserRepository;

@Service
public class ShareCapitalService {
    private static final BigDecimal DEFAULT_UNIT_PRICE = new BigDecimal("100.00");
    private static final int DEFAULT_MINIMUM_SHARES = 10;
    private static final int DEFAULT_MAXIMUM_SHARES = 1000;

    private final NetworkRepository networks;
    private final UserRepository users;
    private final ShareSettingsRepository settings;
    private final ShareCertificateRepository certificates;
    private final ShareTransactionRepository transactions;
    private final ActivityLogRepository activityLogs;
    private final LedgerService ledger;

    public ShareCapitalService(NetworkRepository networks, UserRepository users,
            ShareSettingsRepository settings, ShareCertificateRepository certificates,
            ShareTransactionRepository transactions, ActivityLogRepository activityLogs,
            LedgerService ledger) {
        this.networks = networks;
        this.users = users;
        this.settings = settings;
        this.certificates = certificates;
        this.transactions = transactions;
        this.activityLogs = activityLogs;
        this.ledger = ledger;
    }

    @Transactional
    public ShareSettings getSettings(Long networkId) {
        return settings.findById(networkId).orElseGet(() -> {
            Network network = networks.findById(networkId)
                    .orElseThrow(() -> new IllegalArgumentException("Cooperative not found"));
            return settings.save(defaults(network));
        });
    }

    @Transactional
    public ShareSettings updateSettings(Network network, BigDecimal unitPrice, int minimumShares,
            int statutoryMaxShares) {
        networks.lockForPosting(network.getId());
        if (unitPrice == null || unitPrice.signum() <= 0 || minimumShares <= 0
                || statutoryMaxShares < minimumShares) {
            throw new IllegalArgumentException("Share price and holding limits are invalid");
        }
        ShareSettings value = settings.findById(network.getId()).orElseGet(() -> defaults(network));
        BigDecimal roundedPrice = Money.round(unitPrice);
        if (value.getUnitPrice() != null && value.getUnitPrice().compareTo(roundedPrice) != 0
                && certificates.existsByNetworkIdAndSharesHeldGreaterThan(network.getId(), 0)) {
            throw new IllegalStateException("Unit price cannot change after certificates have been issued");
        }
        boolean incompatibleHolding = certificates.findByNetworkIdOrderByCertificateNumberAsc(network.getId()).stream()
                .mapToInt(ShareCertificate::getSharesHeld)
                .anyMatch(holding -> holding > 0 && (holding < minimumShares || holding > statutoryMaxShares));
        if (incompatibleHolding) {
            throw new IllegalStateException("New limits conflict with an existing certificate holding");
        }
        value.setUnitPrice(roundedPrice);
        value.setMinimumShares(minimumShares);
        value.setStatutoryMaxShares(statutoryMaxShares);
        return settings.save(value);
    }

    @Transactional
    public ShareTransaction issueInitialShares(Network network, User member, int shareCount,
            String paymentMethod, LocalDate date, String requestRef, String actor) {
        return purchase(network, member, shareCount, paymentMethod, date, requestRef, actor, true);
    }

    @Transactional
    public ShareTransaction additionalPurchase(Network network, Long memberId, int shareCount,
            String paymentMethod, LocalDate date, String requestRef, String actor) {
        User member = member(network, memberId);
        if (!"Active".equals(member.getStatus())) {
            throw new IllegalStateException("Only active members may purchase additional shares");
        }
        return purchase(network, member, shareCount, paymentMethod, date, requestRef, actor, false);
    }

    private ShareTransaction purchase(Network network, User member, int shareCount,
            String paymentMethod, LocalDate date, String requestRef, String actor, boolean initial) {
        validateRequest(network, member, shareCount, requestRef);
        networks.lockForPosting(network.getId());
        ShareTransaction duplicate = transactions.findByNetworkIdAndRequestRef(network.getId(), requestRef).orElse(null);
        if (duplicate != null) return duplicate;
        if (initial && !"Pending".equals(member.getStatus())) {
            throw new IllegalStateException("Initial shares are issued while approving a pending member");
        }

        ShareSettings rules = settings.findById(network.getId()).orElseGet(() -> settings.save(defaults(network)));
        ShareCertificate certificate = certificates.findForUpdateByNetworkIdAndMemberId(network.getId(), member.getId()).orElse(null);
        if (initial && certificate != null && certificate.getSharesHeld() > 0) {
            throw new IllegalStateException("This member already has a share certificate");
        }
        int before = certificate == null ? 0 : certificate.getSharesHeld();
        int after = Math.addExact(before, shareCount);
        if (before == 0 && after < rules.getMinimumShares()) {
            throw new IllegalArgumentException("Membership requires at least " + rules.getMinimumShares() + " shares");
        }
        enforceMaximum(rules, after);
        BigDecimal amount = amount(rules, shareCount);
        LocalDate effectiveDate = date != null ? date : LocalDate.now();
        String type = before == 0 ? "PURCHASE" : "ADDITIONAL_PURCHASE";
        String narration = type.equals("PURCHASE") ? "Initial share certificate issue" : "Additional share purchase";
        JournalEntry journal = ledger.post(network, effectiveDate, narration, requestRef,
                "SHARE_CAPITAL", member.getId(), actor,
                LedgerPostings.sharePurchase(member, amount, paymentMethod, narration));

        if (certificate == null) {
            certificate = new ShareCertificate();
            certificate.setNetwork(network);
            certificate.setMember(member);
            certificate.setCertificateNumber(certificateNumber(network, member));
            certificate.setIssuedDate(effectiveDate);
        }
        certificate.setSharesHeld(after);
        certificate.setStatus("ACTIVE");
        certificates.save(certificate);
        return record(network, requestRef, type, null, member, shareCount, rules.getUnitPrice(), amount,
                effectiveDate, journal, narration, actor);
    }

    @Transactional
    public ShareTransaction transfer(Network network, Long fromMemberId, Long toMemberId, int shareCount,
            LocalDate date, String requestRef, String actor) {
        validateOperationRequest(fromMemberId, requestRef, shareCount);
        if (toMemberId == null) throw new IllegalArgumentException("Recipient is required");
        if (fromMemberId.equals(toMemberId)) throw new IllegalArgumentException("Members must be different");
        networks.lockForPosting(network.getId());
        ShareTransaction duplicate = transactions.findByNetworkIdAndRequestRef(network.getId(), requestRef).orElse(null);
        if (duplicate != null) return duplicate;
        User from = member(network, fromMemberId);
        User to = member(network, toMemberId);
        if (!"Active".equals(from.getStatus()) || !"Active".equals(to.getStatus())) {
            throw new IllegalStateException("Share transfers require two active members");
        }
        ShareSettings rules = getSettings(network.getId());
        ShareCertificate fromCertificate = certificates.findForUpdateByNetworkIdAndMemberId(network.getId(), fromMemberId)
                .orElseThrow(() -> new IllegalStateException("Transferor has no share certificate"));
        ShareCertificate toCertificate = certificates.findForUpdateByNetworkIdAndMemberId(network.getId(), toMemberId).orElse(null);
        int toBefore = toCertificate == null ? 0 : toCertificate.getSharesHeld();
        int fromAfter = fromCertificate.getSharesHeld() - shareCount;
        int toAfter = Math.addExact(toBefore, shareCount);
        if (shareCount <= 0 || fromAfter < rules.getMinimumShares()) {
            throw new IllegalArgumentException("Transferor must retain the minimum shareholding");
        }
        if (toBefore == 0 && toAfter < rules.getMinimumShares()) {
            throw new IllegalArgumentException("Recipient must hold at least the minimum shareholding");
        }
        enforceMaximum(rules, toAfter);
        BigDecimal amount = amount(rules, shareCount);
        LocalDate effectiveDate = date != null ? date : LocalDate.now();
        String narration = "Share transfer from " + from.getName() + " to " + to.getName();
        JournalEntry journal = ledger.post(network, effectiveDate, narration, requestRef,
                "SHARE_TRANSFER", from.getId(), actor,
                LedgerPostings.shareTransfer(from, to, amount, narration));
        fromCertificate.setSharesHeld(fromAfter);
        certificates.save(fromCertificate);
        if (toCertificate == null) {
            toCertificate = new ShareCertificate();
            toCertificate.setNetwork(network);
            toCertificate.setMember(to);
            toCertificate.setCertificateNumber(certificateNumber(network, to));
            toCertificate.setIssuedDate(effectiveDate);
            toCertificate.setStatus("ACTIVE");
        }
        toCertificate.setSharesHeld(toAfter);
        certificates.save(toCertificate);
        return record(network, requestRef, "TRANSFER", from, to, shareCount, rules.getUnitPrice(), amount,
                effectiveDate, journal, narration, actor);
    }

    @Transactional
    public ShareTransaction refundOnExit(Network network, Long memberId, String paymentMethod,
            LocalDate date, String requestRef, String actor) {
        validateOperationRequest(memberId, requestRef, 1);
        networks.lockForPosting(network.getId());
        ShareTransaction duplicate = transactions.findByNetworkIdAndRequestRef(network.getId(), requestRef).orElse(null);
        if (duplicate != null) return duplicate;
        User member = member(network, memberId);
        if (!"Active".equals(member.getStatus())) {
            throw new IllegalStateException("Only an active member may receive an exit refund");
        }
        ShareCertificate certificate = certificates.findForUpdateByNetworkIdAndMemberId(network.getId(), memberId)
                .orElseThrow(() -> new IllegalStateException("Member has no share certificate"));
        int shareCount = certificate.getSharesHeld();
        if (shareCount <= 0) throw new IllegalStateException("Member has no shares to refund");
        ShareSettings rules = getSettings(network.getId());
        BigDecimal amount = amount(rules, shareCount);
        LocalDate effectiveDate = date != null ? date : LocalDate.now();
        String narration = "Full share refund on membership exit";
        JournalEntry journal = ledger.post(network, effectiveDate, narration, requestRef,
                "SHARE_REFUND", member.getId(), actor,
                LedgerPostings.shareRefund(member, amount, paymentMethod, narration));
        certificate.setSharesHeld(0);
        certificate.setStatus("REFUNDED");
        certificates.save(certificate);
        member.setStatus("Suspended");
        users.save(member);
        return record(network, requestRef, "REFUND", member, null, shareCount, rules.getUnitPrice(), amount,
                effectiveDate, journal, narration, actor);
    }

    @Transactional(readOnly = true)
    public List<ShareCertificate> register(Long networkId) {
        return certificates.findByNetworkIdOrderByCertificateNumberAsc(networkId);
    }

    @Transactional(readOnly = true)
    public List<ShareTransaction> transactions(Long networkId) {
        return transactions.findByNetworkIdOrderByTransactionDateDescIdDesc(networkId);
    }

    @Transactional(readOnly = true)
    public List<ShareTransaction> memberTransactions(Long networkId, Long memberId) {
        return transactions.findByNetworkIdAndFromMemberIdOrNetworkIdAndToMemberIdOrderByTransactionDateDescIdDesc(
                networkId, memberId, networkId, memberId);
    }

    @Transactional(readOnly = true)
    public ShareCertificate certificate(Long networkId, Long memberId) {
        return certificates.findByNetworkIdAndMemberId(networkId, memberId)
                .orElseThrow(() -> new IllegalArgumentException("Share certificate not found"));
    }

    private ShareSettings defaults(Network network) {
        ShareSettings value = new ShareSettings();
        value.setNetwork(network);
        value.setUnitPrice(DEFAULT_UNIT_PRICE);
        value.setMinimumShares(DEFAULT_MINIMUM_SHARES);
        value.setStatutoryMaxShares(DEFAULT_MAXIMUM_SHARES);
        return value;
    }

    private User member(Network network, Long memberId) {
        User member = users.findById(memberId).orElseThrow(() -> new IllegalArgumentException("Member not found"));
        validateRequest(network, member, 1, "validation");
        return member;
    }

    private void validateRequest(Network network, User member, int shareCount, String requestRef) {
        if (network == null || member == null || member.getSahakariId() == null
                || !network.getId().equals(member.getSahakariId()) || !"member".equalsIgnoreCase(member.getRole())) {
            throw new IllegalArgumentException("Member does not belong to this cooperative");
        }
        if (shareCount <= 0) throw new IllegalArgumentException("Share count must be positive");
        if (requestRef == null || requestRef.isBlank() || requestRef.length() > 100) {
            throw new IllegalArgumentException("A valid request reference is required");
        }
    }

    private void enforceMaximum(ShareSettings rules, int holding) {
        if (holding > rules.getStatutoryMaxShares()) {
            throw new IllegalArgumentException("Holding exceeds the configured statutory maximum of "
                    + rules.getStatutoryMaxShares() + " shares");
        }
    }

    private void validateOperationRequest(Long memberId, String requestRef, int shareCount) {
        if (memberId == null) throw new IllegalArgumentException("Member is required");
        if (shareCount <= 0) throw new IllegalArgumentException("Share count must be positive");
        if (requestRef == null || requestRef.isBlank() || requestRef.length() > 100) {
            throw new IllegalArgumentException("A valid request reference is required");
        }
    }

    private BigDecimal amount(ShareSettings rules, int shareCount) {
        return Money.round(rules.getUnitPrice().multiply(BigDecimal.valueOf(shareCount)));
    }

    private ShareTransaction record(Network network, String requestRef, String type, User from, User to,
            int shareCount, BigDecimal unitPrice, BigDecimal total, LocalDate date, JournalEntry journal,
            String narration, String actor) {
        String actorName = actor == null || actor.isBlank() ? "Cooperative administrator" : actor;
        ShareTransaction value = new ShareTransaction();
        value.setNetwork(network);
        value.setRequestRef(requestRef);
        value.setTransactionNumber("SHR-" + UUID.randomUUID().toString().replace("-", "")
                .substring(0, 16).toUpperCase(Locale.ROOT));
        value.setTransactionType(type);
        value.setFromMember(from);
        value.setToMember(to);
        value.setShareCount(shareCount);
        value.setUnitPrice(Money.round(unitPrice));
        value.setTotalAmount(Money.round(total));
        value.setTransactionDate(date);
        value.setJournalEntry(journal);
        value.setNarration(narration);
        value.setCreatedBy(actorName);
        value.setCreatedAt(Instant.now());
        ShareTransaction saved = transactions.save(value);
        activityLogs.save(new ActivityLog(actorName, "admin", network.getId(), "SHARE_" + type,
                type + " " + shareCount + " shares (" + saved.getTransactionNumber() + ")"));
        return saved;
    }

    private String certificateNumber(Network network, User member) {
        return "SC-" + network.getId() + "-" + member.getId();
    }
}
