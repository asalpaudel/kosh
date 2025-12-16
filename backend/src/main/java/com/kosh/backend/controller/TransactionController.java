package com.kosh.backend.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosh.backend.model.ActivityLog;
import com.kosh.backend.model.ApplicationStatus;
import com.kosh.backend.model.FixedDeposit;
import com.kosh.backend.model.FixedDepositApplication;
import com.kosh.backend.model.LoanApplication;
import com.kosh.backend.model.LoanPackage;
import com.kosh.backend.model.Network;
import com.kosh.backend.model.SavingAccount;
import com.kosh.backend.model.SavingAccountApplication;
import com.kosh.backend.model.Transaction;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.ActivityLogRepository;
import com.kosh.backend.repository.FixedDepositApplicationRepository;
import com.kosh.backend.repository.FixedDepositRepository;
import com.kosh.backend.repository.LoanApplicationRepository;
import com.kosh.backend.repository.LoanPackageRepository;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.repository.SavingAccountApplicationRepository;
import com.kosh.backend.repository.SavingAccountRepository;
import com.kosh.backend.repository.TransactionRepository;
import com.kosh.backend.repository.UserRepository;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionRepository transactionRepo;
    private final UserRepository userRepo;
    private final NetworkRepository networkRepo;
    private final ActivityLogRepository logRepo;

    // --- NEW: Inject Application & Package Repositories ---
    private final FixedDepositApplicationRepository fdAppRepo;
    private final FixedDepositRepository fdPackageRepo;
    private final LoanApplicationRepository loanAppRepo;
    private final LoanPackageRepository loanPackageRepo;
    private final SavingAccountApplicationRepository saAppRepo;
    private final SavingAccountRepository saPackageRepo;

    public TransactionController(
            TransactionRepository transactionRepo, 
            UserRepository userRepo, 
            NetworkRepository networkRepo, 
            ActivityLogRepository logRepo,
            FixedDepositApplicationRepository fdAppRepo,
            FixedDepositRepository fdPackageRepo,
            LoanApplicationRepository loanAppRepo,
            LoanPackageRepository loanPackageRepo,
            SavingAccountApplicationRepository saAppRepo,
            SavingAccountRepository saPackageRepo) {
        
        this.transactionRepo = transactionRepo;
        this.userRepo = userRepo;
        this.networkRepo = networkRepo;
        this.logRepo = logRepo;
        
        // Assign new repos
        this.fdAppRepo = fdAppRepo;
        this.fdPackageRepo = fdPackageRepo;
        this.loanAppRepo = loanAppRepo;
        this.loanPackageRepo = loanPackageRepo;
        this.saAppRepo = saAppRepo;
        this.saPackageRepo = saPackageRepo;
    }

    @PostMapping
    public ResponseEntity<?> addTransaction(@RequestBody Map<String, Object> payload, HttpSession session) {
        try {
            Long adminId = (Long) session.getAttribute("userId");
            Long networkId = (Long) session.getAttribute("sahakariId");
            String adminName = (String) session.getAttribute("userName");

            if (adminId == null || networkId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized access"));
            }

            Network network = networkRepo.findById(networkId)
                    .orElseThrow(() -> new RuntimeException("Network not found"));

            Transaction tx = new Transaction();
            
            // Basic Mapping
            tx.setVoucherId((String) payload.get("voucherId"));
            tx.setStatus((String) payload.getOrDefault("status", "Success"));
            tx.setType((String) payload.get("type"));
            tx.setAmount(Double.valueOf(payload.get("amountValue").toString()));
            tx.setNarration((String) payload.get("narration"));
            
            String dateStr = (String) payload.get("date");
            tx.setDate(dateStr != null ? LocalDate.parse(dateStr) : LocalDate.now());

            // Unpack Details
            @SuppressWarnings("unchecked")
            Map<String, String> details = (Map<String, String>) payload.get("details");
            if (details != null) {
                tx.setMode(details.get("mode"));
                tx.setFyType(details.get("fyType"));
                tx.setAccountHead(details.get("accountHead"));
                tx.setNetworkLedger(details.get("networkLedger"));
                tx.setDirection(details.get("direction"));
                tx.setPaymentMethod(details.get("paymentMethod"));
                tx.setChequeNo(details.get("chequeNo"));
                tx.setBankName(details.get("bankName"));
                tx.setReceivedBy(details.get("receivedBy"));
            }

            // Handle User Mapping
            User targetUser = null;
            if (payload.get("userId") != null) {
                Long targetUserId = Long.valueOf(payload.get("userId").toString());
                targetUser = userRepo.findById(targetUserId.intValue())
                        .orElseThrow(() -> new RuntimeException("User not found"));
                
                tx.setUser(targetUser);
                tx.setUserName(targetUser.getName());
            } else {
                tx.setUserName((String) payload.get("userName"));
            }

            tx.setNetwork(network);

            // =================================================================================
            // ⭐ NEW LOGIC: AUTO-CREATE APPLICATION IF "packageId" IS PRESENT
            // =================================================================================
            if (targetUser != null && payload.get("packageId") != null) {
                Long packageId = Long.valueOf(payload.get("packageId").toString());
                String head = tx.getAccountHead();

                // 1. Handle FIXED DEPOSIT Manual Creation
                if ("Fixed Deposit".equals(head)) {
                    FixedDeposit packageEntity = fdPackageRepo.findById(packageId).orElse(null);
                    if (packageEntity != null) {
                        FixedDepositApplication fdApp = new FixedDepositApplication();
                        fdApp.setUser(targetUser);
                        fdApp.setFixedDeposit(packageEntity);
                        fdApp.setNetwork(network);
                        fdApp.setDepositAmount(tx.getAmount());
                        
                        // Try to get term from details, fallback to package minimum
                        Integer term = packageEntity.getMinDuration();
                        if (payload.get("term") != null) {
                            term = Integer.valueOf(payload.get("term").toString());
                        }
                        fdApp.setDepositTerm(term);
                        
                        fdApp.setApplicationDate(LocalDateTime.now());
                        fdApp.setReviewDate(LocalDateTime.now());
                        fdApp.setStatus(ApplicationStatus.APPROVED); // Auto-approve
                        fdApp.setReviewNotes("Created manually via Transaction by " + adminName);
                        
                        FixedDepositApplication savedApp = fdAppRepo.save(fdApp);
                        
                        // Link Transaction
                        tx.setApplicationId(savedApp.getId());
                        tx.setApplicationType("fixed-deposit");
                    }
                }
                
                // 2. Handle LOAN Manual Creation
                else if ("Loan".equals(head)) {
                    LoanPackage packageEntity = loanPackageRepo.findById(packageId).orElse(null);
                    if (packageEntity != null) {
                        LoanApplication loanApp = new LoanApplication();
                        loanApp.setUser(targetUser);
                        loanApp.setLoanPackage(packageEntity);
                        loanApp.setNetwork(network);
                        loanApp.setRequestedAmount(tx.getAmount());
                        loanApp.setPurpose(tx.getNarration());
                        
                        loanApp.setApplicationDate(LocalDateTime.now());
                        loanApp.setReviewDate(LocalDateTime.now());
                        loanApp.setStatus(ApplicationStatus.APPROVED); // Auto-approve
                        loanApp.setReviewNotes("Created manually via Transaction by " + adminName);

                        LoanApplication savedApp = loanAppRepo.save(loanApp);

                        // Link Transaction
                        tx.setApplicationId(savedApp.getId());
                        tx.setApplicationType("loan");
                    }
                }
                
                // 3. Handle SAVINGS ACCOUNT Manual Creation
                else if ("Savings".equals(head)) {
                    SavingAccount packageEntity = saPackageRepo.findById(packageId).orElse(null);
                    if (packageEntity != null) {
                        SavingAccountApplication saApp = new SavingAccountApplication();
                        saApp.setUser(targetUser);
                        saApp.setSavingAccount(packageEntity);
                        saApp.setNetwork(network);
                        saApp.setInitialDeposit(tx.getAmount());
                        
                        saApp.setApplicationDate(LocalDateTime.now());
                        saApp.setReviewDate(LocalDateTime.now());
                        saApp.setStatus(ApplicationStatus.APPROVED); // Auto-approve
                        saApp.setReviewNotes("Created manually via Transaction by " + adminName);

                        SavingAccountApplication savedApp = saAppRepo.save(saApp);

                        // Link Transaction
                        tx.setApplicationId(savedApp.getId());
                        tx.setApplicationType("saving-account");
                    }
                }
            } 
            // =================================================================================
            // END NEW LOGIC
            // =================================================================================

            // If existing Logic passed applicationId in payload (from normal approval flow), use it
            if (tx.getApplicationId() == null && payload.get("applicationId") != null) {
                tx.setApplicationId(((Number) payload.get("applicationId")).longValue());
                tx.setApplicationType((String) payload.get("applicationType"));
            }

            // --- USER BALANCE UPDATE LOGIC ---
            if (targetUser != null) {
                Double currentBalance = targetUser.getBalance() != null ? targetUser.getBalance() : 0.0;
                Double amount = tx.getAmount();

                if ("Credit".equalsIgnoreCase(tx.getDirection())) {
                    targetUser.setBalance(currentBalance + amount);
                } else if ("Debit".equalsIgnoreCase(tx.getDirection())) {
                    if (currentBalance < amount) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Insufficient user balance."));
                    }
                    targetUser.setBalance(currentBalance - amount);
                }
                userRepo.save(targetUser);
            } else {
                // If no user object, ensure we keep the manually entered name
                tx.setUserName((String) payload.get("userName"));
            }

            // --- RESERVE CALCULATION ---
            Double totalSavings = transactionRepo.getBalanceByHead(networkId, "Savings");
            Double totalFD = transactionRepo.getBalanceByHead(networkId, "Fixed Deposit");
            Double totalLoans = transactionRepo.getOutstandingLoans(networkId);
            Double totalNetwork = transactionRepo.getNetworkBalance(networkId);
            
            // Adjust for CURRENT transaction
            String head = tx.getAccountHead();
            String dir = tx.getDirection();
            Double amt = tx.getAmount();
            String mode = tx.getMode();

            // Handle potential nulls
            if (totalSavings == null) totalSavings = 0.0;
            if (totalFD == null) totalFD = 0.0;
            if (totalLoans == null) totalLoans = 0.0;
            if (totalNetwork == null) totalNetwork = 0.0;

            if ("Savings".equals(head)) {
                totalSavings += ("Credit".equals(dir) ? amt : -amt);
            } else if ("Fixed Deposit".equals(head)) {
                totalFD += ("Credit".equals(dir) ? amt : -amt);
            } else if ("Loan".equals(head)) {
                totalLoans += ("Credit".equals(dir) ? amt : -amt);
            }

            if ("network".equals(mode)) {
                totalNetwork += ("Credit".equals(dir) ? amt : -amt);
            }

            Double reserve = (totalSavings + totalFD) - totalLoans + totalNetwork;
            tx.setNetworkReserve(reserve);

            Transaction savedTx = transactionRepo.save(tx);

            // Log Activity
            try {
                ActivityLog log = new ActivityLog(adminName, "admin", networkId, "ADD_TRANSACTION", 
                    "Added " + tx.getType() + " of Rs. " + tx.getAmount());
                logRepo.save(log);
            } catch (Exception e) {}

            return ResponseEntity.ok(mapTransactionToFrontend(savedTx));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllTransactions(HttpSession session) {
        Long sessionUserId = (Long) session.getAttribute("userId");
        String role = (String) session.getAttribute("userRole");
        Long networkId = (Long) session.getAttribute("sahakariId");

        if (sessionUserId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        List<Transaction> transactions;
        if ("admin".equals(role)) {
            transactions = transactionRepo.findByNetworkIdOrderByDateDesc(networkId);
        } else {
            transactions = transactionRepo.findByUserIdOrderByDateDesc(sessionUserId);
        }

        List<Map<String, Object>> response = transactions.stream()
                .map(this::mapTransactionToFrontend)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/sahakari")
    public ResponseEntity<?> getSahakariTransactions(HttpSession session) {
        Long networkId = (Long) session.getAttribute("sahakariId");
        if (networkId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        List<Transaction> transactions = transactionRepo.findByNetworkIdOrderByDateDesc(networkId);
        List<Map<String, Object>> response = transactions.stream()
                .map(this::mapTransactionToFrontend)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> mapTransactionToFrontend(Transaction tx) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", tx.getId());
        map.put("voucherId", tx.getVoucherId());
        map.put("date", tx.getDate());
        map.put("status", tx.getStatus());
        map.put("userId", tx.getUser() != null ? tx.getUser().getId() : null);
        map.put("userName", tx.getUserName());
        map.put("type", tx.getType());
        map.put("amountValue", tx.getAmount());
        map.put("amount", tx.getAmount());
        map.put("narration", tx.getNarration());
        map.put("applicationId", tx.getApplicationId());
        map.put("networkReserve", tx.getNetworkReserve());
        
        Map<String, String> details = new HashMap<>();
        details.put("mode", tx.getMode());
        details.put("fyType", tx.getFyType());
        details.put("accountHead", tx.getAccountHead());
        details.put("networkLedger", tx.getNetworkLedger());
        details.put("direction", tx.getDirection());
        details.put("paymentMethod", tx.getPaymentMethod());
        details.put("chequeNo", tx.getChequeNo());
        details.put("bankName", tx.getBankName());
        details.put("receivedBy", tx.getReceivedBy());
        details.put("internalHead", tx.getAccountHead());

        map.put("details", details);
        return map;
    }
}