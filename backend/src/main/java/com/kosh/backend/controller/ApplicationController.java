package com.kosh.backend.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
import com.kosh.backend.service.NetworkAccessService;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

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

    // Helper to generate voucher ID
    private String generateVoucherId() {
        return "AUTO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

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
            Double depositAmount = Double.valueOf(request.get("depositAmount").toString());
            Integer depositTerm = Integer.valueOf(request.get("depositTerm").toString());

            User user = userRepo.findById(userId.intValue())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
            
            FixedDeposit fixedDeposit = fixedDepositRepo.findById(packageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Package not found"));
            
            Network network = networkRepo.findById(networkId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Network not found"));

            if (access.isForeign(fixedDeposit.getNetwork(), session)) return forbidden();

            // Validate amounts
            if (depositAmount < fixedDeposit.getMinAmount()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Deposit amount below minimum required"));
            }
            if (depositTerm < fixedDeposit.getMinDuration()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Deposit term below minimum duration"));
            }

            // ===== CHECK USER BALANCE =====
            Double userBalance = user.getBalance();
            if (userBalance == null) {
                userBalance = 0.0;
            }

            if (userBalance < depositAmount) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Insufficient balance");
                errorResponse.put("currentBalance", userBalance);
                errorResponse.put("requiredAmount", depositAmount);
                errorResponse.put("shortfall", depositAmount - userBalance);
                
                return ResponseEntity.badRequest().body(errorResponse);
            }
            // ===== END BALANCE CHECK =====

            FixedDepositApplication application = new FixedDepositApplication();
            application.setUser(user);
            application.setFixedDeposit(fixedDeposit);
            application.setNetwork(network);
            application.setDepositAmount(depositAmount);
            application.setDepositTerm(depositTerm);
            application.setApplicationDate(LocalDateTime.now());
            application.setStatus(ApplicationStatus.PENDING);

            FixedDepositApplication saved = fdAppRepo.save(application);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
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

            User admin = userRepo.findById(adminId.intValue())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found"));

            FixedDepositApplication app = fdAppRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));

            if (access.isForeign(app.getNetwork(), session)) return forbidden();

            String statusStr = request.get("status").toString();
            ApplicationStatus status = ApplicationStatus.valueOf(statusStr);
            String notes = request.containsKey("reviewNotes") ? request.get("reviewNotes").toString() : null;

            if (status == ApplicationStatus.APPROVED) {
                // ⭐ UPDATED: Handle Admin Overrides
                if (request.containsKey("approvedAmount")) {
                    Double newAmount = Double.valueOf(request.get("approvedAmount").toString());
                    app.setDepositAmount(newAmount);
                }
                if (request.containsKey("duration")) {
                    Integer newDuration = Integer.valueOf(request.get("duration").toString());
                    app.setDepositTerm(newDuration);
                }

                // ⭐ UPDATED: Re-validate User Balance (since amount might have increased)
                User user = app.getUser();
                if (user.getBalance() < app.getDepositAmount()) {
                    return rejected(HttpStatus.BAD_REQUEST, "Insufficient user balance for the approved amount.");
                }

                // ⭐ 1. Calculate Maturity Details
                double principal = app.getDepositAmount();
                double rate = app.getFixedDeposit().getInterestRate();
                int months = app.getDepositTerm();
                
                // Simple Interest Formula: A = P(1 + rt)
                double timeInYears = months / 12.0;
                double maturityAmount = principal * (1 + (rate / 100.0 * timeInYears));
                
                app.setInterestRate(rate);
                app.setMaturityDate(LocalDate.now().plusMonths(months));
                app.setMaturityAmount(Math.round(maturityAmount * 100.0) / 100.0);

                // ⭐ 2. Perform Transactions
                Double amount = app.getDepositAmount();

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
                user.setBalance(user.getBalance() - amount);
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
            }
            
            app.setStatus(status);
            app.setReviewDate(LocalDateTime.now());
            app.setReviewedBy(admin);
            app.setReviewNotes(notes);

            return ResponseEntity.ok(fdAppRepo.save(app));
        } catch (Exception e) {
            e.printStackTrace();
            return rejected(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
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
            Double initialDeposit = Double.valueOf(request.get("initialDeposit").toString());

            User user = userRepo.findById(userId.intValue())
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

            if (initialDeposit < savingAccount.getMinBalance()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Initial deposit below minimum balance"));
            }

            SavingAccountApplication application = new SavingAccountApplication();
            application.setUser(user);
            application.setSavingAccount(savingAccount);
            application.setNetwork(network);
            application.setInitialDeposit(initialDeposit);
            application.setApplicationDate(LocalDateTime.now());
            application.setStatus(ApplicationStatus.PENDING);

            SavingAccountApplication saved = saAppRepo.save(application);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
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

            User admin = userRepo.findById(adminId.intValue())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found"));

            SavingAccountApplication app = saAppRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));

            if (access.isForeign(app.getNetwork(), session)) return forbidden();

            String statusStr = request.get("status").toString();
            ApplicationStatus status = ApplicationStatus.valueOf(statusStr);
            String notes = request.containsKey("reviewNotes") ? request.get("reviewNotes").toString() : null;

            if (status == ApplicationStatus.APPROVED) {
                // ⭐ UPDATED: Handle Admin Override
                if (request.containsKey("approvedAmount")) {
                    Double newAmount = Double.valueOf(request.get("approvedAmount").toString());
                    app.setInitialDeposit(newAmount);
                }

                User user = app.getUser();
                Double amount = app.getInitialDeposit();

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
                user.setBalance(user.getBalance() + amount);
                
                transactionRepo.save(tx);
                userRepo.save(user);
            }

            app.setStatus(status);
            app.setReviewDate(LocalDateTime.now());
            app.setReviewedBy(admin);
            app.setReviewNotes(notes);

            return ResponseEntity.ok(saAppRepo.save(app));
        } catch (Exception e) {
            e.printStackTrace();
            return rejected(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
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
            Double requestedAmount = Double.valueOf(request.get("requestedAmount").toString());
            String purpose = request.get("purpose").toString();

            User user = userRepo.findById(userId.intValue())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
            
            LoanPackage loanPackage = loanPackageRepo.findById(packageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Package not found"));
            
            Network network = networkRepo.findById(networkId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Network not found"));

            if (access.isForeign(loanPackage.getNetwork(), session)) return forbidden();

            if (requestedAmount > loanPackage.getMaxAmount()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Requested amount exceeds maximum"));
            }

            LoanApplication application = new LoanApplication();
            application.setUser(user);
            application.setLoanPackage(loanPackage);
            application.setNetwork(network);
            application.setRequestedAmount(requestedAmount);
            application.setPurpose(purpose);
            application.setApplicationDate(LocalDateTime.now());
            application.setStatus(ApplicationStatus.PENDING);

            LoanApplication saved = loanAppRepo.save(application);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
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

            User admin = userRepo.findById(adminId.intValue())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found"));

            LoanApplication application = loanAppRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));

            if (access.isForeign(application.getNetwork(), session)) return forbidden();

            String statusStr = request.get("status").toString();
            ApplicationStatus status = ApplicationStatus.valueOf(statusStr);
            String notes = request.containsKey("reviewNotes") ? request.get("reviewNotes").toString() : null;

            if (status == ApplicationStatus.APPROVED) {
                // ⭐ 1. Determine Final Approved Amount
                // If admin sent "approvedAmount" in body, use it. Otherwise use user's requested amount.
                Double approvedAmt = request.containsKey("approvedAmount") 
                    ? Double.valueOf(request.get("approvedAmount").toString()) 
                    : application.getRequestedAmount();
                
                application.setApprovedAmount(approvedAmt);

                User user = application.getUser();
                Long networkId = application.getNetwork().getId();

                // ⭐ 2. Calculate Current Reserve using NEW FORMULA
                Double totalUserBalance = userRepo.getTotalUserBalanceByNetwork(networkId);
                Double totalLoans = transactionRepo.getOutstandingLoans(networkId);
                Double totalNetwork = transactionRepo.getNetworkBalance(networkId);
                
                Double currentReserve = totalUserBalance - totalLoans + totalNetwork;

                System.out.println("--- Loan Approval Validation ---");
                System.out.println("Total User Balance (Pool): " + totalUserBalance);
                System.out.println("Total Loans (Outstanding): " + totalLoans);
                System.out.println("Net Network Balance: " + totalNetwork);
                System.out.println("Calculated Reserve: " + currentReserve);
                System.out.println("Approved Loan Amount: " + approvedAmt);

                // ⭐ 3. Validate Loan Amount (70% Rule) based on APPROVED Amount
                if (approvedAmt > (currentReserve * 0.7)) {
                    return rejected(HttpStatus.BAD_REQUEST,
                        "Loan rejected: Insufficient liquidity. " +
                        "Loan amount (" + approvedAmt + ") exceeds 70% of network reserve (" +
                        String.format("%.2f", currentReserve * 0.7) + "). " +
                        "Current Reserve: " + currentReserve);
                }

                // ⭐ 4. Set Financial Terms (Rate, Duration, Start Date)
                application.setInterestRate(application.getLoanPackage().getInterestRate());
                
                // Allow admin override for duration, else default to package max
                int duration = request.containsKey("duration") 
                    ? Integer.parseInt(request.get("duration").toString()) 
                    : application.getLoanPackage().getMaxDuration();
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
                loanTx.setNetworkReserve(currentReserve - approvedAmt);

                // Update User Balance
                user.setBalance(user.getBalance() + approvedAmt);
                
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
                expenseTx.setNetworkReserve((currentReserve - approvedAmt) - approvedAmt);

                transactionRepo.save(expenseTx);
            }

            application.setStatus(status);
            application.setReviewDate(LocalDateTime.now());
            application.setReviewedBy(admin);
            application.setReviewNotes(notes);

            return ResponseEntity.ok(loanAppRepo.save(application));
        } catch (Exception e) {
            e.printStackTrace();
            return rejected(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }
}