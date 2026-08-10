package com.kosh.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import com.kosh.backend.service.LoanService;
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

    @Spy NetworkAccessService access = new NetworkAccessService();

    @InjectMocks ApplicationController applicationController;

    private FinanceController financeController() {
        return new FinanceController(fixedDepositRepo, savingAccountRepo, loanPackageRepo, networkRepo, access);
    }

    private TransactionController transactionController() {
        return new TransactionController(transactionRepo, userRepo, networkRepo, logRepo, emailService,
                fdAppRepo, fixedDepositRepo, loanAppRepo, loanPackageRepo, saAppRepo, savingAccountRepo, access);
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

        assertThat(controller.addFixedDeposit(OTHER_NETWORK, "FD", 8.0, 6, 1000.0, null, null, session)
                .getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(controller.addSavingAccount(OTHER_NETWORK, "SA", 5.0, 500.0, null, null, session)
                .getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(controller.addLoanPackage(OTHER_NETWORK, "LP", 12.0, 50000.0, 24, null, null, session)
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

        assertThat(controller.updateFixedDeposit(7L, "renamed", 9.0, 6, 1000.0, null, false, null, session)
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
        when(userRepo.findById(1)).thenReturn(Optional.of(admin()));
        when(loanAppRepo.findById(99L)).thenReturn(Optional.of(foreign));

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

        when(userRepo.findById(1)).thenReturn(Optional.of(admin()));
        when(fdAppRepo.findById(5L)).thenReturn(Optional.of(foreignFd));
        when(saAppRepo.findById(6L)).thenReturn(Optional.of(foreignSa));

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
        foreign.setMaxAmount(100000.0);

        when(userRepo.findById(2)).thenReturn(Optional.of(member()));
        when(loanPackageRepo.findById(4L)).thenReturn(Optional.of(foreign));
        when(networkRepo.findById(OWN_NETWORK)).thenReturn(Optional.of(network(OWN_NETWORK)));

        MockHttpSession session = memberSession();
        var response = applicationController.applyForLoan(
                Map.of("packageId", 4, "requestedAmount", 1000, "purpose", "test"), session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(loanAppRepo, never()).save(any());
    }

    // ------------------------------------------------------------- transactions

    @Test
    void adminCannotPostTransactionAgainstAnotherCooperativeMember() {
        User foreignMember = new User();
        foreignMember.setId(42L);
        foreignMember.setName("Foreign Member");
        foreignMember.setSahakariId(OTHER_NETWORK);

        when(networkRepo.findById(OWN_NETWORK)).thenReturn(Optional.of(network(OWN_NETWORK)));
        when(userRepo.findById(42)).thenReturn(Optional.of(foreignMember));

        var response = transactionController().addTransaction(
                Map.of("userId", 42, "amountValue", 500,
                        "details", Map.of("accountHead", "Savings", "direction", "Credit")),
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
        poorMember.setBalance(100.0);

        when(networkRepo.findById(OWN_NETWORK)).thenReturn(Optional.of(network(OWN_NETWORK)));
        when(userRepo.findById(43)).thenReturn(Optional.of(poorMember));

        var response = transactionController().addTransaction(
                Map.of("userId", 43, "amountValue", 5000, "packageId", 1,
                        "details", Map.of("accountHead", "Savings", "direction", "Debit")),
                adminSession());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verify(saAppRepo, never()).save(any());
        verify(userRepo, never()).save(any());
        verify(transactionRepo, never()).save(any());
        assertThat(poorMember.getBalance()).isEqualTo(100.0);
    }

    @Test
    void adminCannotLinkTransactionToAnotherCooperativeApplication() {
        LoanApplication foreign = new LoanApplication();
        foreign.setNetwork(network(OTHER_NETWORK));

        when(networkRepo.findById(OWN_NETWORK)).thenReturn(Optional.of(network(OWN_NETWORK)));
        when(loanAppRepo.findById(77L)).thenReturn(Optional.of(foreign));

        var response = transactionController().addTransaction(
                Map.of("applicationId", 77, "applicationType", "loan", "amountValue", 500,
                        "details", Map.of("accountHead", "Loan", "direction", "Credit")),
                adminSession());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(transactionRepo, never()).save(any());
    }

    // -------------------------------------------------------------------- setup

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
        member.setBalance(10000.0);
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
