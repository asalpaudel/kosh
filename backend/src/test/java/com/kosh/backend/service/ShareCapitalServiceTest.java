package com.kosh.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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

@ExtendWith(MockitoExtension.class)
class ShareCapitalServiceTest {
    @Mock NetworkRepository networks;
    @Mock UserRepository users;
    @Mock ShareSettingsRepository settings;
    @Mock ShareCertificateRepository certificates;
    @Mock ShareTransactionRepository transactions;
    @Mock ActivityLogRepository activityLogs;
    @Mock LedgerService ledger;

    private ShareCapitalService service;
    private Network network;
    private User member;

    @BeforeEach
    void setUp() {
        service = new ShareCapitalService(networks, users, settings, certificates, transactions, activityLogs, ledger);
        network = new Network();
        network.setId(4L);
        network.setName("Cooperative");
        member = member(11L, "Pending");
    }

    @Test
    void initialPurchaseIssuesCertificateAndPostsCashToShareCapital() {
        stubRules(10, 100);
        when(certificates.findForUpdateByNetworkIdAndMemberId(4L, 11L)).thenReturn(Optional.empty());
        when(ledger.post(eq(network), any(), any(), eq("request-1"), any(), eq(11L), any(), any()))
                .thenReturn(journal());
        when(transactions.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ShareTransaction result = service.issueInitialShares(network, member, 10, "Cash",
                LocalDate.of(2026, 8, 11), "request-1", "Admin");

        assertThat(result.getTotalAmount()).isEqualByComparingTo("1000.00");
        assertThat(result.getTransactionType()).isEqualTo("PURCHASE");
        ArgumentCaptor<ShareCertificate> certificate = ArgumentCaptor.forClass(ShareCertificate.class);
        verify(certificates).save(certificate.capture());
        assertThat(certificate.getValue().getSharesHeld()).isEqualTo(10);
        assertThat(certificate.getValue().getCertificateNumber()).isEqualTo("SC-4-11");
        verify(activityLogs).save(any(ActivityLog.class));
    }

    @Test
    void membershipApprovalRejectsLessThanMinimumAndMoreThanCap() {
        stubRules(10, 20);
        when(certificates.findForUpdateByNetworkIdAndMemberId(4L, 11L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.issueInitialShares(network, member, 9, "Cash", null,
                "too-few", "Admin")).hasMessageContaining("at least 10");
        assertThatThrownBy(() -> service.issueInitialShares(network, member, 21, "Cash", null,
                "too-many", "Admin")).hasMessageContaining("statutory maximum");
        verify(ledger, never()).post(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void transferRequiresTransferorToRetainMinimumHolding() {
        User recipient = member(12L, "Active");
        member.setStatus("Active");
        when(users.findById(11L)).thenReturn(Optional.of(member));
        when(users.findById(12L)).thenReturn(Optional.of(recipient));
        stubRules(10, 100);
        when(certificates.findForUpdateByNetworkIdAndMemberId(4L, 11L))
                .thenReturn(Optional.of(certificate(member, 15)));
        when(certificates.findForUpdateByNetworkIdAndMemberId(4L, 12L))
                .thenReturn(Optional.of(certificate(recipient, 10)));

        assertThatThrownBy(() -> service.transfer(network, 11L, 12L, 6, null, "transfer-1", "Admin"))
                .hasMessageContaining("retain the minimum");
        verify(ledger, never()).post(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void exitRefundIsFullAndSuspendsMembership() {
        member.setStatus("Active");
        when(users.findById(11L)).thenReturn(Optional.of(member));
        stubRules(10, 100);
        ShareCertificate certificate = certificate(member, 25);
        when(certificates.findForUpdateByNetworkIdAndMemberId(4L, 11L)).thenReturn(Optional.of(certificate));
        when(ledger.post(any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(journal());
        when(transactions.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ShareTransaction result = service.refundOnExit(network, 11L, "Cash", null, "refund-1", "Admin");

        assertThat(result.getShareCount()).isEqualTo(25);
        assertThat(certificate.getSharesHeld()).isZero();
        assertThat(certificate.getStatus()).isEqualTo("REFUNDED");
        assertThat(member.getStatus()).isEqualTo("Suspended");
        verify(users).save(member);
    }

    @Test
    void repeatedRequestReferenceReturnsOriginalWithoutDoublePosting() {
        member.setStatus("Active");
        ShareTransaction original = new ShareTransaction();
        original.setRequestRef("approval-retry");
        when(networks.lockForPosting(4L)).thenReturn(4L);
        when(transactions.findByNetworkIdAndRequestRef(4L, "approval-retry")).thenReturn(Optional.of(original));

        ShareTransaction result = service.issueInitialShares(network, member, 10, "Cash", null,
                "approval-retry", "Admin");

        assertThat(result).isSameAs(original);
        verify(ledger, never()).post(any(), any(), any(), any(), any(), any(), any(), any());
    }

    private void stubRules(int minimum, int maximum) {
        when(networks.lockForPosting(4L)).thenReturn(4L);
        when(transactions.findByNetworkIdAndRequestRef(eq(4L), any())).thenReturn(Optional.empty());
        ShareSettings rules = new ShareSettings();
        rules.setNetwork(network);
        rules.setUnitPrice(new BigDecimal("100.00"));
        rules.setMinimumShares(minimum);
        rules.setStatutoryMaxShares(maximum);
        when(settings.findById(4L)).thenReturn(Optional.of(rules));
    }

    private User member(Long id, String status) {
        User value = new User();
        value.setId(id);
        value.setName("Member " + id);
        value.setRole("member");
        value.setSahakariId(4L);
        value.setStatus(status);
        return value;
    }

    private ShareCertificate certificate(User owner, int holding) {
        ShareCertificate value = new ShareCertificate();
        value.setNetwork(network);
        value.setMember(owner);
        value.setSharesHeld(holding);
        value.setStatus("ACTIVE");
        return value;
    }

    private JournalEntry journal() {
        JournalEntry value = new JournalEntry();
        value.setSequenceNo(9L);
        return value;
    }
}
