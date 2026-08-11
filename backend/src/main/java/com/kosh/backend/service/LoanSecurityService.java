package com.kosh.backend.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kosh.backend.model.LoanApplication;
import com.kosh.backend.model.LoanCollateral;
import com.kosh.backend.model.LoanGuarantor;
import com.kosh.backend.model.LoanPackage;
import com.kosh.backend.model.RepaymentSchedule;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.LoanCollateralRepository;
import com.kosh.backend.repository.LoanGuarantorRepository;
import com.kosh.backend.repository.RepaymentScheduleRepository;
import com.kosh.backend.repository.UserRepository;
import com.kosh.backend.repository.NetworkRepository;

@Service
public class LoanSecurityService {
    private static final Set<String> COLLATERAL_TYPES = Set.of(
            "LAND", "BUILDING", "VEHICLE", "DEPOSIT", "EQUIPMENT", "OTHER");

    private final LoanCollateralRepository collaterals;
    private final LoanGuarantorRepository guarantors;
    private final RepaymentScheduleRepository schedules;
    private final UserRepository users;
    private final NetworkRepository networks;

    public LoanSecurityService(LoanCollateralRepository collaterals, LoanGuarantorRepository guarantors,
            RepaymentScheduleRepository schedules, UserRepository users, NetworkRepository networks) {
        this.collaterals = collaterals;
        this.guarantors = guarantors;
        this.schedules = schedules;
        this.users = users;
        this.networks = networks;
    }

    @Transactional
    public void register(LoanApplication loan, List<CollateralInput> collateralInputs,
            List<GuarantorInput> guarantorInputs) {
        networks.lockForPosting(loan.getNetwork().getId());
        BigDecimal available = loan.getLoanPackage().getMaxAmount().subtract(currentExposure(loan.getUser()));
        if (loan.getRequestedAmount().compareTo(available.max(Money.ZERO)) > 0) {
            throw new IllegalArgumentException("Requested loan exceeds borrowing capacity after outstanding guarantees");
        }
        if (collateralInputs == null || collateralInputs.isEmpty()) {
            throw new IllegalArgumentException("At least one collateral is required");
        }
        for (CollateralInput input : collateralInputs) collaterals.save(collateral(loan, input));
        enforceLoanToValue(loan, loan.getRequestedAmount());

        Set<Long> seen = new HashSet<>();
        if (guarantorInputs == null) return;
        for (GuarantorInput input : guarantorInputs) {
            LoanGuarantor guarantor = guarantor(loan, input);
            if (!seen.add(guarantor.getGuarantor().getId())) {
                throw new IllegalArgumentException("A guarantor can only be listed once per loan");
            }
            guarantors.save(guarantor);
        }
    }

    @Transactional
    public void assertApprovalAllowed(LoanApplication loan, BigDecimal approvedAmount) {
        networks.lockForPosting(loan.getNetwork().getId());
        enforceLoanToValue(loan, approvedAmount);
        BigDecimal available = Money.round(loan.getLoanPackage().getMaxAmount()
                .subtract(currentExposure(loan.getUser())));
        if (approvedAmount.compareTo(available.max(Money.ZERO)) > 0) {
            throw new IllegalArgumentException("Loan exceeds borrowing capacity after outstanding guarantees");
        }
        for (LoanGuarantor guarantor : guarantors.findByLoanApplicationIdAndStatus(loan.getId(), "ACTIVE")) {
            validateGoodStanding(guarantor.getGuarantor());
        }
    }

    @Transactional(readOnly = true)
    public BigDecimal currentExposure(User member) {
        BigDecimal total = Money.ZERO;
        for (LoanGuarantor guarantee : guarantors.findByGuarantorIdAndStatus(member.getId(), "ACTIVE")) {
            total = total.add(guarantee.getLiabilityAmount().min(outstandingPrincipal(guarantee.getLoanApplication())));
        }
        return Money.round(total);
    }

    @Transactional
    public boolean releaseIfClosed(LoanApplication loan, String actor) {
        List<RepaymentSchedule> installments = schedules.findByLoanApplicationIdOrderByDueDateAsc(loan.getId());
        if (installments.isEmpty() || installments.stream().anyMatch(item -> item.outstanding().signum() > 0)) {
            return false;
        }
        Instant releasedAt = Instant.now();
        List<LoanCollateral> pledged = collaterals.findByLoanApplicationIdAndStatus(loan.getId(), "PLEDGED");
        pledged.forEach(item -> { item.setStatus("RELEASED"); item.setReleasedAt(releasedAt); item.setReleasedBy(actor); });
        collaterals.saveAll(pledged);
        List<LoanGuarantor> active = guarantors.findByLoanApplicationIdAndStatus(loan.getId(), "ACTIVE");
        active.forEach(item -> { item.setStatus("RELEASED"); item.setReleasedAt(releasedAt); });
        guarantors.saveAll(active);
        return !pledged.isEmpty() || !active.isEmpty();
    }

    @Transactional(readOnly = true)
    public List<LoanCollateral> collateralRegister(Long networkId) {
        return collaterals.findByNetworkIdOrderByIdDesc(networkId);
    }

    @Transactional(readOnly = true)
    public List<LoanGuarantor> guarantors(Long loanId) {
        return guarantors.findByLoanApplicationIdOrderByIdAsc(loanId);
    }

    @Transactional(readOnly = true)
    public boolean isSecuredLoan(Long loanId) {
        return loanId != null
                && !collaterals.findByLoanApplicationIdAndStatus(loanId, "PLEDGED").isEmpty();
    }

    private LoanCollateral collateral(LoanApplication loan, CollateralInput input) {
        String type = required(input.type(), "Collateral type").toUpperCase();
        if (!COLLATERAL_TYPES.contains(type)) throw new IllegalArgumentException("Unsupported collateral type");
        BigDecimal valuation = positive(input.valuation(), "Collateral valuation");
        if (input.valuationDate() == null || input.valuationDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Collateral valuation date is invalid");
        }
        if (type.equals("LAND")) {
            required(input.plotNumber(), "Land plot number"); required(input.area(), "Land area");
            required(input.location(), "Land location");
            required(input.ownershipDocumentReference(), "Land ownership document");
        }
        LoanCollateral value = new LoanCollateral();
        value.setNetwork(loan.getNetwork()); value.setLoanApplication(loan); value.setCollateralType(type);
        value.setValuation(valuation); value.setValuer(required(input.valuer(), "Valuer"));
        value.setValuationDate(input.valuationDate());
        value.setDocumentReference(required(input.documentReference(), "Collateral document reference"));
        value.setPlotNumber(trim(input.plotNumber())); value.setArea(trim(input.area()));
        value.setLocation(trim(input.location()));
        value.setOwnershipDocumentReference(trim(input.ownershipDocumentReference()));
        value.setStatus("PLEDGED");
        return value;
    }

    private LoanGuarantor guarantor(LoanApplication loan, GuarantorInput input) {
        String email = required(input.memberEmail(), "Guarantor member email");
        User member = users.findBySahakariIdAndEmailIgnoreCase(loan.getNetwork().getId(), email);
        if (member == null || member.getId().equals(loan.getUser().getId())
                || !"member".equalsIgnoreCase(member.getRole())) {
            throw new IllegalArgumentException("Guarantor must be another member of this cooperative");
        }
        validateGoodStanding(member);
        BigDecimal liability = positive(input.liabilityAmount(), "Guarantor liability");
        BigDecimal limit = loan.getLoanPackage().getGuarantorExposureLimit();
        if (currentExposure(member).add(liability).compareTo(limit) > 0) {
            throw new IllegalArgumentException("Guarantor exposure limit would be exceeded");
        }
        LoanGuarantor value = new LoanGuarantor();
        value.setNetwork(loan.getNetwork()); value.setLoanApplication(loan); value.setGuarantor(member);
        value.setLiabilityAmount(liability);
        value.setConsentReference(required(input.consentReference(), "Guarantor consent reference"));
        value.setConsentedAt(Instant.now()); value.setStatus("ACTIVE");
        return value;
    }

    private void validateGoodStanding(User member) {
        if (!"Active".equals(member.getStatus())
                || schedules.countOverdueForMember(member.getId(), LocalDate.now()) > 0) {
            throw new IllegalArgumentException("Guarantor is not a member in good standing");
        }
    }

    private void enforceLoanToValue(LoanApplication loan, BigDecimal amount) {
        BigDecimal valuation = collaterals.findByLoanApplicationIdAndStatus(loan.getId(), "PLEDGED").stream()
                .map(LoanCollateral::getValuation).reduce(Money.ZERO, BigDecimal::add);
        LoanPackage product = loan.getLoanPackage();
        BigDecimal maximum = valuation.multiply(product.getMaxLoanToValuePercent())
                .divide(new BigDecimal("100"), 2, java.math.RoundingMode.DOWN);
        if (amount.compareTo(maximum) > 0) throw new IllegalArgumentException("Loan exceeds product loan-to-value limit");
    }

    private BigDecimal outstandingPrincipal(LoanApplication loan) {
        List<RepaymentSchedule> items = schedules.findByLoanApplicationIdOrderByDueDateAsc(loan.getId());
        if (items.isEmpty()) return loan.getApprovedAmount() != null ? loan.getApprovedAmount() : loan.getRequestedAmount();
        return items.stream().map(item -> item.getPrincipalAmount().subtract(item.getPrincipalPaid()))
                .filter(value -> value.signum() > 0).reduce(Money.ZERO, BigDecimal::add);
    }

    private BigDecimal positive(BigDecimal value, String label) {
        if (value == null || value.signum() <= 0) throw new IllegalArgumentException(label + " must be positive");
        return Money.round(value);
    }

    private String required(String value, String label) {
        String trimmed = trim(value);
        if (trimmed == null) throw new IllegalArgumentException(label + " is required");
        return trimmed;
    }

    private String trim(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        return value.trim();
    }

    public record CollateralInput(String type, BigDecimal valuation, String valuer, LocalDate valuationDate,
            String documentReference, String plotNumber, String area, String location,
            String ownershipDocumentReference) {}
    public record GuarantorInput(String memberEmail, BigDecimal liabilityAmount, String consentReference) {}
}
