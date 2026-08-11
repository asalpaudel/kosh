package com.kosh.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.kosh.backend.model.LoanApplication;
import com.kosh.backend.model.LoanCollateral;
import com.kosh.backend.model.LoanGuarantor;
import com.kosh.backend.model.LoanPackage;
import com.kosh.backend.model.Network;
import com.kosh.backend.model.RepaymentSchedule;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.LoanCollateralRepository;
import com.kosh.backend.repository.LoanGuarantorRepository;
import com.kosh.backend.repository.RepaymentScheduleRepository;
import com.kosh.backend.repository.UserRepository;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.service.LoanSecurityService.CollateralInput;
import com.kosh.backend.service.LoanSecurityService.GuarantorInput;

@ExtendWith(MockitoExtension.class)
class LoanSecurityServiceTest {
    @Mock LoanCollateralRepository collaterals;
    @Mock LoanGuarantorRepository guarantors;
    @Mock RepaymentScheduleRepository schedules;
    @Mock UserRepository users;
    @Mock NetworkRepository networks;

    private LoanSecurityService service;
    private LoanApplication loan;

    @BeforeEach
    void setUp() {
        service = new LoanSecurityService(collaterals, guarantors, schedules, users, networks);
        Network network = new Network(); network.setId(3L);
        User borrower = member(7L, "borrower@example.com");
        LoanPackage product = new LoanPackage(); product.setId(4L); product.setNetwork(network);
        product.setMaxAmount(amount("100000.00")); product.setMaxLoanToValuePercent(amount("70.00"));
        product.setGuarantorExposureLimit(amount("50000.00"));
        loan = new LoanApplication(); loan.setId(9L); loan.setNetwork(network); loan.setUser(borrower);
        loan.setLoanPackage(product); loan.setRequestedAmount(amount("70000.00"));
        lenient().when(guarantors.findByGuarantorIdAndStatus(any(), any())).thenReturn(List.of());
    }

    @Test
    void ltvRejectsAmountAboveVerifiedCollateralLimit() {
        LoanCollateral collateral = collateral("90000.00");
        when(collaterals.findByLoanApplicationIdAndStatus(9L, "PLEDGED")).thenReturn(List.of(collateral));

        assertThatThrownBy(() -> service.register(loan, List.of(building("90000.00")), List.of()))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("loan-to-value");
    }

    @Test
    void landRequiresPlotAreaLocationAndOwnershipEvidence() {
        CollateralInput land = new CollateralInput("LAND", amount("100000.00"), "Valuer",
                LocalDate.now(), "VAL-1", null, "2 ropani", "Kathmandu", "OWN-1");

        assertThatThrownBy(() -> service.register(loan, List.of(land), List.of()))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("plot number");
    }

    @Test
    void guarantorExposureCannotExceedProductLimit() {
        loan.setRequestedAmount(amount("50000.00"));
        LoanCollateral collateral = collateral("100000.00");
        when(collaterals.findByLoanApplicationIdAndStatus(9L, "PLEDGED")).thenReturn(List.of(collateral));
        User guarantor = member(8L, "guarantor@example.com");
        when(users.findBySahakariIdAndEmailIgnoreCase(3L, "guarantor@example.com")).thenReturn(guarantor);
        LoanGuarantor prior = new LoanGuarantor(); prior.setGuarantor(guarantor); prior.setLiabilityAmount(amount("40000.00"));
        LoanApplication priorLoan = new LoanApplication(); priorLoan.setId(11L); priorLoan.setRequestedAmount(amount("40000.00"));
        prior.setLoanApplication(priorLoan);
        when(guarantors.findByGuarantorIdAndStatus(8L, "ACTIVE")).thenReturn(List.of(prior));

        assertThatThrownBy(() -> service.register(loan, List.of(building("100000.00")),
                List.of(new GuarantorInput("guarantor@example.com", amount("15000.00"), "CONSENT-1"))))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("exposure limit");
    }

    @Test
    void outstandingGuaranteeReducesMembersOwnBorrowingCapacity() {
        LoanGuarantor prior = new LoanGuarantor(); prior.setGuarantor(loan.getUser());
        prior.setLiabilityAmount(amount("40000.00"));
        LoanApplication guaranteedLoan = new LoanApplication(); guaranteedLoan.setId(12L);
        guaranteedLoan.setRequestedAmount(amount("40000.00")); prior.setLoanApplication(guaranteedLoan);
        when(guarantors.findByGuarantorIdAndStatus(7L, "ACTIVE")).thenReturn(List.of(prior));

        assertThatThrownBy(() -> service.register(loan, List.of(building("100000.00")), List.of()))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("borrowing capacity");
    }

    @Test
    void repaidLoanReleasesCollateralAndGuarantees() {
        RepaymentSchedule paid = new RepaymentSchedule(); paid.setPrincipalAmount(amount("100.00"));
        paid.setPrincipalPaid(amount("100.00")); paid.setInterestAmount(amount("10.00"));
        paid.setInterestPaid(amount("10.00"));
        LoanCollateral collateral = collateral("100000.00"); collateral.setStatus("PLEDGED");
        LoanGuarantor guarantor = new LoanGuarantor(); guarantor.setStatus("ACTIVE");
        when(schedules.findByLoanApplicationIdOrderByDueDateAsc(9L)).thenReturn(List.of(paid));
        when(collaterals.findByLoanApplicationIdAndStatus(9L, "PLEDGED")).thenReturn(List.of(collateral));
        when(guarantors.findByLoanApplicationIdAndStatus(9L, "ACTIVE")).thenReturn(List.of(guarantor));

        assertThat(service.releaseIfClosed(loan, "Teller")).isTrue();
        assertThat(collateral.getStatus()).isEqualTo("RELEASED");
        assertThat(collateral.getReleasedBy()).isEqualTo("Teller");
        assertThat(guarantor.getStatus()).isEqualTo("RELEASED");
        verify(collaterals).saveAll(List.of(collateral));
    }

    private CollateralInput building(String valuation) {
        return new CollateralInput("BUILDING", amount(valuation), "Valuer", LocalDate.now(),
                "VAL-1", null, null, null, null);
    }

    private LoanCollateral collateral(String valuation) {
        LoanCollateral value = new LoanCollateral(); value.setValuation(amount(valuation)); return value;
    }

    private User member(Long id, String email) {
        User value = new User(); value.setId(id); value.setEmail(email); value.setRole("member"); value.setStatus("Active");
        return value;
    }

    private BigDecimal amount(String value) { return new BigDecimal(value); }
}
