package com.kosh.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpSession;

import com.kosh.backend.model.FixedDeposit;
import com.kosh.backend.model.FixedDepositApplication;
import com.kosh.backend.model.LoanApplication;
import com.kosh.backend.model.LoanPackage;
import com.kosh.backend.model.Network;
import com.kosh.backend.model.SavingAccount;
import com.kosh.backend.model.SavingAccountApplication;
import com.kosh.backend.model.User;
import com.kosh.backend.model.ApplicationStatus;
import com.kosh.backend.repository.ActivityLogRepository;
import com.kosh.backend.repository.FixedDepositApplicationRepository;
import com.kosh.backend.repository.FixedDepositRepository;
import com.kosh.backend.repository.LoanApplicationRepository;
import com.kosh.backend.repository.LoanPackageRepository;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.repository.RepaymentScheduleRepository;
import com.kosh.backend.repository.SavingAccountApplicationRepository;
import com.kosh.backend.repository.SavingAccountRepository;
import com.kosh.backend.repository.TransactionRepository;
import com.kosh.backend.repository.UserRepository;
import com.kosh.backend.service.EmailService;
import com.kosh.backend.ledger.LedgerReports;
import com.kosh.backend.ledger.LedgerService;
import com.kosh.backend.service.LoanService;
import com.kosh.backend.service.LoanSecurityService;
import com.kosh.backend.service.NetworkAccessService;

/**
 * Phase 0 exit criteria: an admin of cooperative A must be refused on every
 * cooperative B resource, and must never fall through to a repository write.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TenantIsolationTest {

    private static final long OWN_NETWORK = 10L;
    private static final long OTHER_NETWORK = 20L;

    @Mock FixedDepositRepository fixedDepositRepo;
    @Mock SavingAccountRepository savingAccountRepo;
    @Mock LoanPackageRepository loanPackageRepo;
    @Mock NetworkRepository networkRepo;
    @Mock FixedDepositApplicationRepository fdAppRepo;
    @Mock SavingAccountApplicationRepository saAppRepo;
    @Mock LoanApplicationRepository loanAppRepo;
    @Mock UserRepository userRepo;
    @Mock TransactionRepository transactionRepo;
    @Mock RepaymentScheduleRepository repaymentScheduleRepo;
    @Mock ActivityLogRepository logRepo;
    @Mock EmailService emailService;
    @Mock LoanService loanService;
    @Mock LoanSecurityService loanSecurityService;
    @Mock LedgerService ledger;
    @Mock LedgerReports ledgerReports;

    @Spy NetworkAccessService access = new NetworkAccessService();

    @InjectMocks ApplicationController applicationController;

    private FinanceController financeController() {
        return new FinanceController(fixedDepositRepo, savingAccountRepo, loanPackageRepo, networkRepo, access);
    }

    private TransactionController transactionController() {
        return new TransactionController(transactionRepo, userRepo, networkRepo, logRepo, emailService,
                fdAppRepo, fixedDepositRepo, loanAppRepo, loanPackageRepo, saAppRepo, savingAccountRepo,
                access, ledger, ledgerReports, repaymentScheduleRepo, loanSecurityService);
    }

    // ------------------------------------------------------------------ finance

    @Test
    void adminCannotListAnotherCooperativeProducts() {
        FinanceController controller = financeController();
        MockHttpSession session = adminSession();

        assertThat(controller.getFixedDeposits(OTHER_NETWORK, session).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(controller.getSavingAccounts(OTHER_NETWORK, session).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(controller.getLoanPackages(OTHER_NETWORK, session).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);

        verify(fixedDepositRepo, never()).findByNetworkId(any());
        verify(savingAccountRepo, never()).findByNetworkId(any());
        verify(loanPackageRepo, never()).findByNetworkId(any());
    }

    @Test
    void adminCannotCreateProductsInsideAnotherCooperative() {
        FinanceController controller = financeController();
        MockHttpSession session = adminSession();

        assertThat(controller.addFixedDeposit(OTHER_NETWORK, "FD", money("8.00"), 6, money("1000.00"), null, null, session)
                .getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(controller.addSavingAccount(OTHER_NETWORK, "SA", money("5.00"), money("500.00"),
                "DAILY_PRODUCT", "MONTHLY", "ACTUAL_365", null, null, session)
                .getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(controller.addLoanPackage(OTHER_NETWORK, "LP", money("12.00"), money("50000.00"), 24,
                money("70.00"), money("100000.00"), null, null, session)
                .getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        verify(fixedDepositRepo, never()).save(any());
        verify(savingAccountRepo, never()).save(any());
        verify(loanPackageRepo, never()).save(any());
    }

    @Test
    void adminCannotEditOrDeleteAnotherCooperativeProduct() {
        FixedDeposit foreign = new FixedDeposit();
        foreign.setNetwork(network(OTHER_NETWORK));
        when(fixedDepositRepo.findById(7L)).thenReturn(Optional.of(foreign));

        FinanceController controller = financeController();
        MockHttpSession session = adminSession();

        assertThat(controller.updateFixedDeposit(7L, "renamed", money("9.00"), 6, money("1000.00"), null, false, null, session)
                .getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(controller.deleteFixedDeposit(7L, session).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);

        verify(fixedDepositRepo, never()).save(any());
        verify(fixedDepositRepo, never()).delete(any());
    }

    @Test
    void adminCannotReadAnotherCooperativeProductBanner() {
        SavingAccount foreign = new SavingAccount();
        foreign.setNetwork(network(OTHER_NETWORK));
        foreign.setBannerData("banner".getBytes());
        foreign.setBannerName("banner.png");
        foreign.setBannerType("image/png");
        when(savingAccountRepo.findById(3L)).thenReturn(Optional.of(foreign));

        assertThat(financeController().getSavingAccountBanner(3L, adminSession()).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    // ------------------------------------------------------------- applications

    @Test
    void adminCannotListAnotherCooperativeApplications() {
        MockHttpSession session = adminSession();

        assertThat(applicationController.getNetworkFixedDepositApplications(OTHER_NETWORK, session)
                .getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(applicationController.getNetworkSavingAccountApplications(OTHER_NETWORK, session)
                .getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(applicationController.getNetworkLoanApplications(OTHER_NETWORK, session)
                .getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        verify(fdAppRepo, never()).findByNetworkId(any());
        verify(saAppRepo, never()).findByNetworkId(any());
        verify(loanAppRepo, never()).findByNetworkId(any());
    }

    @Test
    void adminCannotApproveAnotherCooperativeLoan() {
        LoanApplication foreign = new LoanApplication();
        foreign.setNetwork(network(OTHER_NETWORK));
        when(userRepo.findById(1L)).thenReturn(Optional.of(admin()));
        when(loanAppRepo.findByIdForReview(99L)).thenReturn(Optional.of(foreign));

        var response = applicationController.reviewLoanApplication(
                99L, Map.of("status", "APPROVED"), adminSession());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(loanAppRepo, never()).save(any());
        verify(loanService, never()).generateRepaymentSchedule(any());
        verify(transactionRepo, never()).save(any());
    }

    @Test
    void adminCannotApproveAnotherCooperativeDepositOrSavingsApplication() {
        FixedDepositApplication foreignFd = new FixedDepositApplication();
        foreignFd.setNetwork(network(OTHER_NETWORK));
        SavingAccountApplication foreignSa = new SavingAccountApplication();
        foreignSa.setNetwork(network(OTHER_NETWORK));

        when(userRepo.findById(1L)).thenReturn(Optional.of(admin()));
        when(fdAppRepo.findByIdForReview(5L)).thenReturn(Optional.of(foreignFd));
        when(saAppRepo.findByIdForReview(6L)).thenReturn(Optional.of(foreignSa));

        MockHttpSession session = adminSession();

        assertThat(applicationController.reviewFixedDepositApplication(5L, Map.of("status", "APPROVED"), session)
                .getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(applicationController.reviewSavingAccountApplication(6L, Map.of("status", "APPROVED"), session)
                .getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        verify(fdAppRepo, never()).save(any());
        verify(saAppRepo, never()).save(any());
        verify(transactionRepo, never()).save(any());
    }

    @Test
    void memberCannotApplyToAnotherCooperativePackage() {
        LoanPackage foreign = new LoanPackage();
        foreign.setNetwork(network(OTHER_NETWORK));
        foreign.setMaxAmount(money("100000.00"));

        when(userRepo.findById(2L)).thenReturn(Optional.of(member()));
        when(loanPackageRepo.findById(4L)).thenReturn(Optional.of(foreign));
        when(networkRepo.findById(OWN_NETWORK)).thenReturn(Optional.of(network(OWN_NETWORK)));

        MockHttpSession session = memberSession();
        var response = applicationController.applyForLoan(
                Map.of("packageId", 4, "requestedAmount", 1000, "purpose", "test"), session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(loanAppRepo, never()).save(any());
    }

    @Test
    void reviewedApplicationsCannotBeApprovedOrRejectedAgain() {
        LoanApplication reviewed = new LoanApplication();
        reviewed.setNetwork(network(OWN_NETWORK));
        reviewed.setStatus(ApplicationStatus.APPROVED);
        when(userRepo.findById(1L)).thenReturn(Optional.of(admin()));
        when(loanAppRepo.findByIdForReview(88L)).thenReturn(Optional.of(reviewed));

        var response = applicationController.reviewLoanApplication(
                88L, Map.of("status", "APPROVED"), adminSession());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        verify(loanAppRepo, never()).save(any());
        verify(transactionRepo, never()).save(any());
        verify(loanService, never()).generateRepaymentSchedule(any());
    }

    // ------------------------------------------------------------- transactions

    @Test
    void adminCannotPostTransactionAgainstAnotherCooperativeMember() {
        User foreignMember = new User();
        foreignMember.setId(42L);
        foreignMember.setName("Foreign Member");
        foreignMember.setSahakariId(OTHER_NETWORK);

        when(networkRepo.findById(OWN_NETWORK)).thenReturn(Optional.of(network(OWN_NETWORK)));
        when(userRepo.findById(42L)).thenReturn(Optional.of(foreignMember));

        var response = transactionController().addTransaction(
                Map.of("idempotencyKey", "11111111-1111-4111-8111-111111111111",
                        "userId", 42, "amountValue", 500,
                        "details", Map.of("mode", "member", "accountHead", "Savings", "direction", "Credit")),
                adminSession());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(userRepo, never()).save(any());
        verify(transactionRepo, never()).save(any());
    }

    @Test
    void withdrawalBeyondBalanceIsRefusedBeforeAnyApplicationIsCreated() {
        User poorMember = new User();
        poorMember.setId(43L);
        poorMember.setName("Broke Member");
        poorMember.setSahakariId(OWN_NETWORK);
        poorMember.setBalance(money("100.00"));

        when(networkRepo.findById(OWN_NETWORK)).thenReturn(Optional.of(network(OWN_NETWORK)));
        when(userRepo.findById(43L)).thenReturn(Optional.of(poorMember));

        var response = transactionController().addTransaction(
                Map.of("idempotencyKey", "22222222-2222-4222-8222-222222222222",
                        "userId", 43, "amountValue", 5000, "packageId", 1,
                        "details", Map.of("mode", "member", "accountHead", "Savings", "direction", "Debit")),
                adminSession());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verify(saAppRepo, never()).save(any());
        verify(userRepo, never()).save(any());
        verify(transactionRepo, never()).save(any());
        assertThat(poorMember.getBalance()).isEqualByComparingTo(money("100.00"));
    }

    @Test
    void adminCannotLinkTransactionToAnotherCooperativeApplication() {
        LoanApplication foreign = new LoanApplication();
        foreign.setNetwork(network(OTHER_NETWORK));

        when(networkRepo.findById(OWN_NETWORK)).thenReturn(Optional.of(network(OWN_NETWORK)));
        when(loanAppRepo.findById(77L)).thenReturn(Optional.of(foreign));

        var response = transactionController().addTransaction(
                Map.of("idempotencyKey", "33333333-3333-4333-8333-333333333333",
                        "applicationId", 77, "applicationType", "loan", "amountValue", 500,
                        "details", Map.of("mode", "network", "accountHead", "Loan", "direction", "Credit")),
                adminSession());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(transactionRepo, never()).save(any());
    }

    @Test
    void identicalTransactionReplayReturnsTheOriginalWithoutPostingAgain() {
        TransactionController controller = transactionController();
        Map<String, Object> payload = Map.of(
                "idempotencyKey", "44444444-4444-4444-8444-444444444444",
                "amountValue", 500,
                "details", Map.of("mode", "network", "accountHead", "Cash", "direction", "Credit"));
        com.kosh.backend.model.Transaction original = new com.kosh.backend.model.Transaction();
        original.setId(71L);
        original.setNetwork(network(OWN_NETWORK));
        original.setRequestFingerprint(controller.requestFingerprint(OWN_NETWORK, payload));
        when(transactionRepo.findByNetworkIdAndIdempotencyKey(
                OWN_NETWORK, "44444444-4444-4444-8444-444444444444"))
                .thenReturn(Optional.of(original));

        var response = controller.addTransaction(payload, adminSession());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(transactionRepo, never()).save(any());
        verify(ledger, never()).post(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void reusedIdempotencyKeyWithDifferentMoneyIsRejected() {
        TransactionController controller = transactionController();
        Map<String, Object> originalPayload = Map.of(
                "idempotencyKey", "55555555-5555-4555-8555-555555555555",
                "amountValue", 500,
                "details", Map.of("mode", "network", "accountHead", "Cash", "direction", "Credit"));
        Map<String, Object> changedPayload = Map.of(
                "idempotencyKey", "55555555-5555-4555-8555-555555555555",
                "amountValue", 900,
                "details", Map.of("mode", "network", "accountHead", "Cash", "direction", "Credit"));
        com.kosh.backend.model.Transaction original = new com.kosh.backend.model.Transaction();
        original.setRequestFingerprint(controller.requestFingerprint(OWN_NETWORK, originalPayload));
        when(transactionRepo.findByNetworkIdAndIdempotencyKey(
                OWN_NETWORK, "55555555-5555-4555-8555-555555555555"))
                .thenReturn(Optional.of(original));

        var response = controller.addTransaction(changedPayload, adminSession());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        verify(transactionRepo, never()).save(any());
        verify(ledger, never()).post(any(), any(), any(), any(), any(), any(), any(), any());
    }

    // -------------------------------------------------------------------- setup

    private static BigDecimal money(String value) {
        return new BigDecimal(value);
    }

    private Network network(long id) {
        Network network = new Network();
        network.setId(id);
        return network;
    }

    private User admin() {
        User admin = new User();
        admin.setId(1L);
        admin.setName("Coop A Admin");
        admin.setSahakariId(OWN_NETWORK);
        return admin;
    }

    private User member() {
        User member = new User();
        member.setId(2L);
        member.setName("Coop A Member");
        member.setSahakariId(OWN_NETWORK);
        member.setBalance(money("10000.00"));
        return member;
    }

    private MockHttpSession adminSession() {
        return session("admin", 1L);
    }

    private MockHttpSession memberSession() {
        return session("member", 2L);
    }

    private MockHttpSession session(String role, Long userId) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("userRole", role);
        session.setAttribute("userId", userId);
        session.setAttribute("userName", "Coop A " + role);
        session.setAttribute("sahakariId", OWN_NETWORK);
        return session;
    }
}
