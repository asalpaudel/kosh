package com.kosh.backend.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.kosh.backend.model.ApplicationStatus;
import com.kosh.backend.model.FixedDeposit;
import com.kosh.backend.model.FixedDepositApplication;
import com.kosh.backend.model.LoanApplication;
import com.kosh.backend.model.LoanPackage;
import com.kosh.backend.model.Network;
import com.kosh.backend.model.RepaymentSchedule;
import com.kosh.backend.model.SavingAccount;
import com.kosh.backend.model.SavingAccountApplication;
import com.kosh.backend.model.Transaction;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.FixedDepositApplicationRepository;
import com.kosh.backend.repository.FixedDepositRepository;
import com.kosh.backend.repository.LoanApplicationRepository;
import com.kosh.backend.repository.LoanPackageRepository;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.repository.SavingAccountApplicationRepository;
import com.kosh.backend.repository.SavingAccountRepository;
import com.kosh.backend.repository.TransactionRepository;
import com.kosh.backend.repository.UserRepository;
import com.kosh.backend.repository.RepaymentScheduleRepository;
import com.kosh.backend.service.LoanService;
import com.kosh.backend.ledger.LedgerPostings;
import com.kosh.backend.ledger.LedgerReports;
import com.kosh.backend.ledger.LedgerService;
import com.kosh.backend.service.Money;
import com.kosh.backend.service.NetworkAccessService;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private static final Logger LOGGER = LoggerFactory.getLogger(ApplicationController.class);

    @Autowired
    private FixedDepositApplicationRepository fdAppRepo;

    @Autowired
    private SavingAccountApplicationRepository saAppRepo;

    @Autowired
    private LoanApplicationRepository loanAppRepo;

    @Autowired
    private FixedDepositRepository fixedDepositRepo;

    @Autowired
    private SavingAccountRepository savingAccountRepo;

    @Autowired
    private LoanPackageRepository loanPackageRepo;

    @Autowired
    private NetworkRepository networkRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private TransactionRepository transactionRepo;

    @Autowired
    private RepaymentScheduleRepository repaymentScheduleRepo;

    // Inject LoanService for Schedule Generation
    @Autowired
    private LoanService loanService;

    @Autowired
    private NetworkAccessService access;

    @Autowired
    private LedgerService ledger;

    @Autowired
    private LedgerReports reports;

    // Helper to generate voucher ID
    private String generateVoucherId() {
        return "AUTO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    /** A cooperative may lend out at most 70% of its reserve. */
    private static final BigDecimal LENDING_LIMIT = new BigDecimal("0.70");

    private ResponseEntity<?> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(Map.of("error", "Not permitted for this cooperative"));
    }

    /**
     * Marks the surrounding transaction for rollback so that a business rejection cannot
     * leave partial writes (or dirty managed entities) behind when the method returns
     * a normal error response instead of throwing.
     */
    private ResponseEntity<?> rejected(HttpStatus status, Object body) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
        }
        return ResponseEntity.status(status).body(body);
    }

    // ============================================================================
    // FIXED DEPOSIT
    // ============================================================================
    
    @PostMapping("/fixed-deposit")
    public ResponseEntity<?> applyForFixedDeposit(
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            Long networkId = (Long) session.getAttribute("sahakariId");
            
            if (userId == null || networkId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated"));
            }

            Long packageId = Long.valueOf(request.get("packageId").toString());
            BigDecimal depositAmount = Money.of(request.get("depositAmount"));
            Integer depositTerm = Integer.valueOf(request.get("depositTerm").toString());

            User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
            
            FixedDeposit fixedDeposit = fixedDepositRepo.findById(packageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Package not found"));
            
            Network network = networkRepo.findById(networkId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Network not found"));

            if (access.isForeign(fixedDeposit.getNetwork(), session)) return forbidden();

            // Validate amounts
            if (depositAmount.compareTo(fixedDeposit.getMinAmount()) < 0) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Deposit amount below minimum required"));
            }
            if (depositTerm < fixedDeposit.getMinDuration()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Deposit term below minimum duration"));
            }

            // ===== CHECK USER BALANCE =====
            BigDecimal userBalance = user.getBalance();

            if (userBalance.compareTo(depositAmount) < 0) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Insufficient balance");
                errorResponse.put("currentBalance", userBalance);
                errorResponse.put("requiredAmount", depositAmount);
                errorResponse.put("shortfall", depositAmount.subtract(userBalance));
                
                return ResponseEntity.badRequest().body(errorResponse);
            }
            // ===== END BALANCE CHECK =====

            FixedDepositApplication application = new FixedDepositApplication();
            application.setUser(user);
            application.setFixedDeposit(fixedDeposit);
            application.setNetwork(network);
            application.setDepositAmount(depositAmount);
            application.setDepositTerm(depositTerm);
            application.setApplicationDate(Instant.now());
            application.setStatus(ApplicationStatus.PENDING);

            FixedDepositApplication saved = fdAppRepo.save(application);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            LOGGER.error("Unable to create fixed-deposit application");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Unable to create application"));
        }
    }

    @GetMapping("/fixed-deposit/user")
    public ResponseEntity<?> getUserFixedDepositApplications(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
        }
        return ResponseEntity.ok(fdAppRepo.findByUserId(userId));
    }

    @GetMapping("/fixed-deposit/network/{networkId}")
    public ResponseEntity<?> getNetworkFixedDepositApplications(
            @PathVariable Long networkId, HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) return forbidden();
        return ResponseEntity.ok(fdAppRepo.findByNetworkId(networkId));
    }

    // ⭐ UPDATED: Fixed Deposit Review with Double Transaction & Maturity Calculation
    @PutMapping("/fixed-deposit/{id}/review")
    @Transactional
    public ResponseEntity<?> reviewFixedDepositApplication(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        try {
            Long adminId = (Long) session.getAttribute("userId");
            if (adminId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
            }

            User admin = userRepo.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found"));

            FixedDepositApplication app = fdAppRepo.findByIdForReview(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));

            if (access.isForeign(app.getNetwork(), session)) return forbidden();

            if (app.getStatus() != ApplicationStatus.PENDING) {
                return rejected(HttpStatus.CONFLICT, Map.of("error", "Application has already been reviewed"));
            }
            ApplicationStatus status = reviewDecision(request.get("status"));
            String notes = request.containsKey("reviewNotes") ? request.get("reviewNotes").toString() : null;

            if (status == ApplicationStatus.APPROVED) {
                // ⭐ UPDATED: Handle Admin Overrides
                if (request.containsKey("approvedAmount")) {
                    app.setDepositAmount(Money.of(request.get("approvedAmount")));
                }
                if (request.containsKey("duration")) {
                    Integer newDuration = Integer.valueOf(request.get("duration").toString());
                    app.setDepositTerm(newDuration);
                }

                if (app.getDepositAmount() == null || app.getDepositAmount().signum() <= 0
                        || app.getDepositAmount().compareTo(app.getFixedDeposit().getMinAmount()) < 0
                        || app.getDepositTerm() == null
                        || app.getDepositTerm() < app.getFixedDeposit().getMinDuration()) {
                    return rejected(HttpStatus.BAD_REQUEST, Map.of("error", "Approved fixed-deposit terms are invalid"));
                }

                // ⭐ UPDATED: Re-validate User Balance (since amount might have increased)
                User user = app.getUser();
                if (user.getBalance().compareTo(app.getDepositAmount()) < 0) {
                    return rejected(HttpStatus.BAD_REQUEST, "Insufficient user balance for the approved amount.");
                }

                // ⭐ 1. Calculate Maturity Details
                BigDecimal principal = app.getDepositAmount();
                BigDecimal rate = app.getFixedDeposit().getInterestRate();
                int months = app.getDepositTerm();

                // Simple Interest: A = P(1 + rt), with t in years and r as a percentage.
                BigDecimal interest = principal
                    .multiply(rate)
                    .multiply(BigDecimal.valueOf(months))
                    .divide(BigDecimal.valueOf(1200), Money.SCALE, Money.ROUNDING);

                app.setInterestRate(rate);
                app.setMaturityDate(LocalDate.now().plusMonths(months));
                app.setMaturityAmount(principal.add(interest));

                // ⭐ 2. Perform Transactions
                BigDecimal amount = app.getDepositAmount();

                // DEBIT: Remove money from User's Savings
                Transaction debitTx = new Transaction();
                debitTx.setVoucherId(generateVoucherId());
                debitTx.setDate(LocalDate.now());
                debitTx.setStatus("Success");
                debitTx.setUser(user);
                debitTx.setUserName(user.getName());
                debitTx.setNetwork(app.getNetwork());
                debitTx.setType("Savings Withdrawal (FD Transfer)");
                debitTx.setAmount(amount);
                debitTx.setNarration("Auto-debit for FD Application #" + app.getId());
                debitTx.setApplicationId(app.getId());
                debitTx.setApplicationType("fixed-deposit");
                
                // Details
                debitTx.setMode("member");
                debitTx.setFyType("Current FY");
                debitTx.setAccountHead("Savings");
                debitTx.setDirection("Debit"); // Decrease Balance
                debitTx.setPaymentMethod("Transfer");
                
                // Update Balance (Deduct)
                user.setBalance(user.getBalance().subtract(amount));
                transactionRepo.save(debitTx);

                // CREDIT: Add money to Fixed Deposit Account
                Transaction creditTx = new Transaction();
                creditTx.setVoucherId(generateVoucherId());
                creditTx.setDate(LocalDate.now());
                creditTx.setStatus("Success");
                creditTx.setUser(user);
                creditTx.setUserName(user.getName());
                creditTx.setNetwork(app.getNetwork());
                creditTx.setType("Fixed Deposit (Creation)");
                creditTx.setAmount(amount);
                creditTx.setNarration("FD Created from Savings for " + app.getDepositTerm() + " months @ " + rate + "%");
                creditTx.setApplicationId(app.getId());
                creditTx.setApplicationType("fixed-deposit");

                // Details
                creditTx.setMode("member");
                creditTx.setFyType("Current FY");
                creditTx.setAccountHead("Fixed Deposit");
                creditTx.setDirection("Credit"); // Asset record
                creditTx.setPaymentMethod("Transfer");

                transactionRepo.save(creditTx);
                userRepo.save(user); // Save final balance

                ledger.post(app.getNetwork(), LocalDate.now(),
                        "Fixed deposit #" + app.getId() + " funded from member savings",
                        creditTx.getVoucherId(), "fixed-deposit-application", app.getId(), admin.getName(),
                        LedgerPostings.savingsToFixedDeposit(user, amount,
                                "FD for " + app.getDepositTerm() + " months @ " + rate + "%"));
            }
            
            app.setStatus(status);
            app.setReviewDate(Instant.now());
            app.setReviewedBy(admin);
            app.setReviewNotes(notes);

            return ResponseEntity.ok(fdAppRepo.save(app));
        } catch (IllegalArgumentException e) {
            return rejected(HttpStatus.BAD_REQUEST, Map.of("error", "Invalid review decision or terms"));
        } catch (Exception e) {
            return rejected(HttpStatus.INTERNAL_SERVER_ERROR, Map.of("error", "Unable to review application"));
        }
    }

    // ============================================================================
    // SAVING ACCOUNT
    // ============================================================================
    
    @PostMapping("/saving-account")
    public ResponseEntity<?> applyForSavingAccount(
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            Long networkId = (Long) session.getAttribute("sahakariId");
            
            if (userId == null || networkId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated"));
            }

            Long packageId = Long.valueOf(request.get("packageId").toString());
            BigDecimal initialDeposit = Money.of(request.get("initialDeposit"));

            User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
            
            SavingAccount savingAccount = savingAccountRepo.findById(packageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Package not found"));
            
            Network network = networkRepo.findById(networkId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Network not found"));

            if (access.isForeign(savingAccount.getNetwork(), session)) return forbidden();

            // Check if user already has a savings account
            List<SavingAccountApplication> existingApplications = saAppRepo.findByUserId(userId);
            boolean hasApprovedAccount = existingApplications.stream()
                .anyMatch(app -> app.getStatus() == ApplicationStatus.APPROVED);
            
            if (hasApprovedAccount) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "You already have an approved savings account."));
            }
            
            boolean hasPendingApplication = existingApplications.stream()
                .anyMatch(app -> app.getStatus() == ApplicationStatus.PENDING);
            
            if (hasPendingApplication) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "You already have a pending savings account application."));
            }

            if (initialDeposit.compareTo(savingAccount.getMinBalance()) < 0) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Initial deposit below minimum balance"));
            }

            SavingAccountApplication application = new SavingAccountApplication();
            application.setUser(user);
            application.setSavingAccount(savingAccount);
            application.setNetwork(network);
            application.setInitialDeposit(initialDeposit);
            application.setApplicationDate(Instant.now());
            application.setStatus(ApplicationStatus.PENDING);

            SavingAccountApplication saved = saAppRepo.save(application);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            LOGGER.error("Unable to create savings application");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Unable to create application"));
        }
    }

    @GetMapping("/saving-account/user")
    public ResponseEntity<?> getUserSavingAccountApplications(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
        }
        return ResponseEntity.ok(saAppRepo.findByUserId(userId));
    }

    @GetMapping("/saving-account/network/{networkId}")
    public ResponseEntity<?> getNetworkSavingAccountApplications(
            @PathVariable Long networkId, HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) return forbidden();
        return ResponseEntity.ok(saAppRepo.findByNetworkId(networkId));
    }

    // ⭐ UPDATED: Saving Account Review with Single Transaction
    @PutMapping("/saving-account/{id}/review")
    @Transactional
    public ResponseEntity<?> reviewSavingAccountApplication(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        try {
            Long adminId = (Long) session.getAttribute("userId");
            if (adminId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
            }

            User admin = userRepo.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found"));

            SavingAccountApplication app = saAppRepo.findByIdForReview(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));

            if (access.isForeign(app.getNetwork(), session)) return forbidden();

            if (app.getStatus() != ApplicationStatus.PENDING) {
                return rejected(HttpStatus.CONFLICT, Map.of("error", "Application has already been reviewed"));
            }
            ApplicationStatus status = reviewDecision(request.get("status"));
            String notes = request.containsKey("reviewNotes") ? request.get("reviewNotes").toString() : null;

            if (status == ApplicationStatus.APPROVED) {
                // ⭐ UPDATED: Handle Admin Override
                if (request.containsKey("approvedAmount")) {
                    app.setInitialDeposit(Money.of(request.get("approvedAmount")));
                }

                User user = app.getUser();
                BigDecimal amount = app.getInitialDeposit();
                if (amount == null || amount.signum() <= 0
                        || amount.compareTo(app.getSavingAccount().getMinBalance()) < 0) {
                    return rejected(HttpStatus.BAD_REQUEST, Map.of("error", "Approved savings amount is invalid"));
                }

                // CREDIT: Initial Deposit added to user account 
                Transaction tx = new Transaction();
                tx.setVoucherId(generateVoucherId());
                tx.setDate(LocalDate.now());
                tx.setStatus("Success");
                tx.setUser(user);
                tx.setUserName(user.getName());
                tx.setNetwork(app.getNetwork());
                tx.setType("Savings Account Opening");
                tx.setAmount(amount);
                tx.setNarration("Initial Deposit for Savings Account");
                tx.setApplicationId(app.getId());
                tx.setApplicationType("saving-account");

                // Details
                tx.setMode("member");
                tx.setFyType("Current FY");
                tx.setAccountHead("Savings");
                tx.setDirection("Credit"); // Money added to balance
                tx.setPaymentMethod("Cash");

                // Update Balance (Add)
                user.setBalance(user.getBalance().add(amount));
                
                transactionRepo.save(tx);
                userRepo.save(user);

                ledger.post(app.getNetwork(), LocalDate.now(),
                        "Savings account #" + app.getId() + " opened",
                        tx.getVoucherId(), "saving-account-application", app.getId(), admin.getName(),
                        LedgerPostings.forTransaction("member", LedgerPostings.SAVINGS, "Credit",
                                tx.getPaymentMethod(), null, amount, user, "Initial deposit"));
            }

            app.setStatus(status);
            app.setReviewDate(Instant.now());
            app.setReviewedBy(admin);
            app.setReviewNotes(notes);

            return ResponseEntity.ok(saAppRepo.save(app));
        } catch (IllegalArgumentException e) {
            return rejected(HttpStatus.BAD_REQUEST, Map.of("error", "Invalid review decision or terms"));
        } catch (Exception e) {
            return rejected(HttpStatus.INTERNAL_SERVER_ERROR, Map.of("error", "Unable to review application"));
        }
    }

    // ============================================================================
    // LOAN APPLICATIONS
    // ============================================================================
    
    @PostMapping("/loan")
    public ResponseEntity<?> applyForLoan(
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            Long networkId = (Long) session.getAttribute("sahakariId");
            
            if (userId == null || networkId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated"));
            }

            Long packageId = Long.valueOf(request.get("packageId").toString());
            BigDecimal requestedAmount = Money.of(request.get("requestedAmount"));
            String purpose = request.get("purpose").toString();

            User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
            
            LoanPackage loanPackage = loanPackageRepo.findById(packageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Package not found"));
            
            Network network = networkRepo.findById(networkId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Network not found"));

            if (access.isForeign(loanPackage.getNetwork(), session)) return forbidden();

            if (requestedAmount.compareTo(loanPackage.getMaxAmount()) > 0) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Requested amount exceeds maximum"));
            }

            LoanApplication application = new LoanApplication();
            application.setUser(user);
            application.setLoanPackage(loanPackage);
            application.setNetwork(network);
            application.setRequestedAmount(requestedAmount);
            application.setPurpose(purpose);
            application.setApplicationDate(Instant.now());
            application.setStatus(ApplicationStatus.PENDING);

            LoanApplication saved = loanAppRepo.save(application);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            LOGGER.error("Unable to create loan application");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Unable to create application"));
        }
    }

    @GetMapping("/loan/user")
    public ResponseEntity<?> getUserLoanApplications(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
        }
        return ResponseEntity.ok(loanAppRepo.findByUserId(userId));
    }

    @GetMapping("/loan/network/{networkId}")
    public ResponseEntity<?> getNetworkLoanApplications(
            @PathVariable Long networkId, HttpSession session) {
        if (!access.canViewNetwork(networkId, session)) return forbidden();
        return ResponseEntity.ok(loanAppRepo.findByNetworkId(networkId));
    }

    // ⭐ UPDATED: Loan Review with 70% Reserve Check, Financial Terms, and Schedule Generation
    @PutMapping("/loan/{id}/review")
    @Transactional
    public ResponseEntity<?> reviewLoanApplication(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        try {
            Long adminId = (Long) session.getAttribute("userId");
            if (adminId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
            }

            User admin = userRepo.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found"));

            LoanApplication application = loanAppRepo.findByIdForReview(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));

            if (access.isForeign(application.getNetwork(), session)) return forbidden();

            if (application.getStatus() != ApplicationStatus.PENDING) {
                return rejected(HttpStatus.CONFLICT, Map.of("error", "Application has already been reviewed"));
            }
            ApplicationStatus status = reviewDecision(request.get("status"));
            String notes = request.containsKey("reviewNotes") ? request.get("reviewNotes").toString() : null;

            if (status == ApplicationStatus.APPROVED) {
                // ⭐ 1. Determine Final Approved Amount
                // If admin sent "approvedAmount" in body, use it. Otherwise use user's requested amount.
                BigDecimal approvedAmt = request.containsKey("approvedAmount")
                    ? Money.of(request.get("approvedAmount"))
                    : application.getRequestedAmount();
                if (approvedAmt == null || approvedAmt.signum() <= 0
                        || approvedAmt.compareTo(application.getLoanPackage().getMaxAmount()) > 0) {
                    return rejected(HttpStatus.BAD_REQUEST, Map.of("error", "Approved loan amount is invalid"));
                }
                
                application.setApprovedAmount(approvedAmt);

                User user = application.getUser();
                Long networkId = application.getNetwork().getId();
                networkRepo.lockForPosting(networkId);

                // ⭐ 2. Calculate Current Reserve using NEW FORMULA
                // Liquidity comes from the ledger, so two loans approved at the same moment
                // cannot each pass the rule against the same stale figure.
                BigDecimal currentReserve = reports.liquidity(networkId);
                BigDecimal lendingCeiling = Money.round(currentReserve.multiply(LENDING_LIMIT));

                // ⭐ 3. Validate Loan Amount (70% Rule) based on APPROVED Amount
                if (approvedAmt.compareTo(lendingCeiling) > 0) {
                    return rejected(HttpStatus.BAD_REQUEST,
                        "Loan rejected: Insufficient liquidity. " +
                        "Loan amount (" + approvedAmt + ") exceeds 70% of network reserve (" +
                        lendingCeiling + "). " +
                        "Current Reserve: " + currentReserve);
                }

                // ⭐ 4. Set Financial Terms (Rate, Duration, Start Date)
                application.setInterestRate(application.getLoanPackage().getInterestRate());
                
                // Allow admin override for duration, else default to package max
                int duration = request.containsKey("duration") 
                    ? Integer.parseInt(request.get("duration").toString()) 
                    : application.getLoanPackage().getMaxDuration();
                if (duration <= 0 || duration > application.getLoanPackage().getMaxDuration()) {
                    return rejected(HttpStatus.BAD_REQUEST, Map.of("error", "Approved loan duration is invalid"));
                }
                application.setDurationInMonths(duration);
                application.setStartDate(LocalDate.now());

                // ⭐ 5. Save State & Generate Repayment Schedule
                // We must save first so the application has an ID (if new changes exist) 
                // and to persist the approved amount before schedule generation relies on it.
                application = loanAppRepo.save(application);
                loanService.generateRepaymentSchedule(application);

                // ⭐ 6. Process Transactions (Double Entry)
                
                // Transaction A: Credit to User (Asset Creation)
                Transaction loanTx = new Transaction();
                loanTx.setVoucherId(generateVoucherId());
                loanTx.setDate(LocalDate.now());
                loanTx.setStatus("Success");
                loanTx.setUser(user);
                loanTx.setUserName(user.getName());
                loanTx.setNetwork(application.getNetwork());
                loanTx.setType("Loan Disbursement");
                loanTx.setAmount(approvedAmt); // Use approved amount
                loanTx.setNarration("Loan approved: " + application.getPurpose());
                loanTx.setApplicationId(application.getId());
                loanTx.setApplicationType("loan");

                loanTx.setMode("member");
                loanTx.setFyType("Current FY");
                loanTx.setAccountHead("Loan");
                loanTx.setDirection("Debit");
                loanTx.setPaymentMethod("Transfer");

                // Update Reserve Snapshot (Reduced by new loan)
                loanTx.setNetworkReserve(currentReserve.subtract(approvedAmt));

                // Update User Balance
                user.setBalance(user.getBalance().add(approvedAmt));
                
                transactionRepo.save(loanTx);
                userRepo.save(user);

                // Transaction B: Debit Network (Cash Outflow)
                Transaction expenseTx = new Transaction();
                expenseTx.setVoucherId(generateVoucherId());
                expenseTx.setDate(LocalDate.now());
                expenseTx.setStatus("Success");
                expenseTx.setUser(null);
                expenseTx.setUserName("Sahakari Network");
                expenseTx.setNetwork(application.getNetwork());
                expenseTx.setType("Loan Disbursement Expense");
                expenseTx.setAmount(approvedAmt); // Use approved amount
                expenseTx.setNarration("Disbursement expense for Loan Application #" + application.getId());
                expenseTx.setApplicationId(application.getId());
                expenseTx.setApplicationType("loan");

                expenseTx.setMode("network");
                expenseTx.setFyType("Current FY");
                expenseTx.setAccountHead("Loan Disbursement");
                expenseTx.setNetworkLedger("Cash");
                expenseTx.setDirection("Debit");
                expenseTx.setPaymentMethod("Cash");

                // Snapshot effect: Reserve decreases again due to cash outflow
                expenseTx.setNetworkReserve(currentReserve.subtract(approvedAmt).subtract(approvedAmt));

                transactionRepo.save(expenseTx);

                ledger.post(application.getNetwork(), LocalDate.now(),
                        "Loan #" + application.getId() + " disbursed",
                        loanTx.getVoucherId(), "loan-application", application.getId(), admin.getName(),
                        LedgerPostings.loanDisbursedToSavings(user, approvedAmt, application.getPurpose()));
            }

            application.setStatus(status);
            application.setReviewDate(Instant.now());
            application.setReviewedBy(admin);
            application.setReviewNotes(notes);

            return ResponseEntity.ok(loanAppRepo.save(application));
        } catch (IllegalArgumentException e) {
            return rejected(HttpStatus.BAD_REQUEST, Map.of("error", "Invalid review decision or terms"));
        } catch (Exception e) {
            return rejected(HttpStatus.INTERNAL_SERVER_ERROR, Map.of("error", "Unable to review application"));
        }
    }

    private ApplicationStatus reviewDecision(Object rawStatus) {
        if (rawStatus == null) throw new IllegalArgumentException("Missing review decision");
        ApplicationStatus status = ApplicationStatus.valueOf(rawStatus.toString());
        if (status != ApplicationStatus.APPROVED && status != ApplicationStatus.REJECTED) {
            throw new IllegalArgumentException("Unsupported review decision");
        }
        return status;
    }
}
