package com.kosh.backend.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
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
import com.kosh.backend.model.RepaymentSchedule;
import com.kosh.backend.model.Transaction;
import com.kosh.backend.model.TransactionType;
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
import com.kosh.backend.repository.RepaymentScheduleRepository;
import com.kosh.backend.repository.UserRepository;
import com.kosh.backend.service.EmailService;
import com.kosh.backend.ledger.LedgerLine;
import com.kosh.backend.ledger.LedgerPostings;
import com.kosh.backend.ledger.LedgerReports;
import com.kosh.backend.ledger.LedgerService;
import com.kosh.backend.service.Money;
import com.kosh.backend.service.RepaymentAllocation;
import com.kosh.backend.service.NetworkAccessService;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionRepository transactionRepo;
    private final UserRepository userRepo;
    private final NetworkRepository networkRepo;
    private final ActivityLogRepository logRepo;
    private final EmailService emailService;

    // --- NEW: Inject Application & Package Repositories ---
    private final FixedDepositApplicationRepository fdAppRepo;
    private final FixedDepositRepository fdPackageRepo;
    private final LoanApplicationRepository loanAppRepo;
    private final LoanPackageRepository loanPackageRepo;
    private final SavingAccountApplicationRepository saAppRepo;
    private final SavingAccountRepository saPackageRepo;
    private final NetworkAccessService access;
    private final LedgerService ledger;
    private final LedgerReports reports;
    private final RepaymentScheduleRepository scheduleRepo;

    public TransactionController(
            TransactionRepository transactionRepo, 
            UserRepository userRepo, 
            NetworkRepository networkRepo, 
            ActivityLogRepository logRepo,
            EmailService emailService,
            FixedDepositApplicationRepository fdAppRepo,
            FixedDepositRepository fdPackageRepo,
            LoanApplicationRepository loanAppRepo,
            LoanPackageRepository loanPackageRepo,
            SavingAccountApplicationRepository saAppRepo,
            SavingAccountRepository saPackageRepo,
            NetworkAccessService access,
            LedgerService ledger,
            LedgerReports reports,
            RepaymentScheduleRepository scheduleRepo) {

        this.access = access;
        this.ledger = ledger;
        this.reports = reports;
        this.scheduleRepo = scheduleRepo;

        this.transactionRepo = transactionRepo;
        this.userRepo = userRepo;
        this.networkRepo = networkRepo;
        this.logRepo = logRepo;
        this.emailService = emailService;
        
        // Assign new repos
        this.fdAppRepo = fdAppRepo;
        this.fdPackageRepo = fdPackageRepo;
        this.loanAppRepo = loanAppRepo;
        this.loanPackageRepo = loanPackageRepo;
        this.saAppRepo = saAppRepo;
        this.saPackageRepo = saPackageRepo;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> addTransaction(@RequestBody Map<String, Object> payload, HttpSession session) {
        try {
            Long adminId = (Long) session.getAttribute("userId");
            Long networkId = (Long) session.getAttribute("sahakariId");
            String adminName = (String) session.getAttribute("userName");

            if (adminId == null || networkId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized access"));
            }

            Network network = networkRepo.findById(networkId)
                .orElseThrow(() -> new RuntimeException("Network not found"));

            Transaction tx = new Transaction();
            
            // Basic Mapping
            // The cooperative's own entries carry no member voucher book, but every row
            // still needs a reference an operator can quote back.
            String voucherId = (String) payload.get("voucherId");
            tx.setVoucherId(voucherId != null && !voucherId.isBlank()
                    ? voucherId
                    : "NET-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            tx.setStatus((String) payload.getOrDefault("status", "Success"));
            tx.setType((String) payload.get("type"));
            tx.setAmount(Money.of(payload.get("amountValue")));
            // A negative amount flips the direction of the posting: a "Debit" of -5000 passes
            // the sufficient-funds check below and then credits the member instead.
            if (tx.getAmount() == null || tx.getAmount().signum() <= 0) {
                return reject(HttpStatus.BAD_REQUEST, "Amount must be greater than zero");
            }
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

                if (!networkId.equals(targetUser.getSahakariId())) {
                    return reject(HttpStatus.FORBIDDEN, "Member belongs to another cooperative");
                }

                tx.setUser(targetUser);
                tx.setUserName(targetUser.getName());
            } else {
                tx.setUserName((String) payload.get("userName"));
            }

            tx.setNetwork(network);

            // --- USER BALANCE UPDATE ---
            // Runs before any application row is written so a rejected withdrawal cannot
            // leave an APPROVED application behind with no matching ledger entry.
            if (targetUser != null && !"Loan".equals(tx.getAccountHead())) {
                BigDecimal currentBalance = targetUser.getBalance();
                BigDecimal amount = tx.getAmount();

                if ("Credit".equalsIgnoreCase(tx.getDirection())) {
                    targetUser.setBalance(currentBalance.add(amount));
                } else if ("Debit".equalsIgnoreCase(tx.getDirection())) {
                    if (currentBalance.compareTo(amount) < 0) {
                        return reject(HttpStatus.BAD_REQUEST, "Insufficient user balance.");
                    }
                    targetUser.setBalance(currentBalance.subtract(amount));
                }
                userRepo.save(targetUser);
            }

            // ========================================================================
            // ⭐ LOGIC FIX: Check if this is a NEW Application or an Existing one
            // ========================================================================
            
            boolean isNewApplication = payload.get("applicationId") == null;

            if (targetUser != null && payload.get("packageId") != null && isNewApplication) {
                Long packageId = Long.valueOf(payload.get("packageId").toString());
                String head = tx.getAccountHead();
                String direction = tx.getDirection();

                // Determine TransactionType based on direction
                TransactionType txType;
                if ("Loan".equals(head)) {
                    // Loan: Debit = Disbursement (DEPOSIT into user hand), Credit = Repayment (WITHDRAW)
                    txType = "Debit".equals(direction) ? TransactionType.DEPOSIT : TransactionType.WITHDRAW;
                } else {
                    // FD/Savings: Credit = Deposit (DEPOSIT), Debit = Withdraw (WITHDRAW)
                    txType = "Credit".equals(direction) ? TransactionType.DEPOSIT : TransactionType.WITHDRAW;
                }

                // --- 1. LOAN CREATION (Only if new) ---
                if ("Loan".equals(head)) {
                    LoanPackage packageEntity = loanPackageRepo.findById(packageId).orElse(null);
                    if (packageEntity != null && access.isForeign(packageEntity.getNetwork(), session)) {
                        return reject(HttpStatus.FORBIDDEN, "Package belongs to another cooperative");
                    }
                    if (packageEntity != null) {
                        LoanApplication loanApp = new LoanApplication();
                        loanApp.setUser(targetUser);
                        loanApp.setLoanPackage(packageEntity);
                        loanApp.setNetwork(network);
                        loanApp.setRequestedAmount(tx.getAmount());
                        loanApp.setApprovedAmount(tx.getAmount());
                        loanApp.setTransactionType(txType);
                        
                        // New loan disbursement defaults
                        loanApp.setInterestRate(packageEntity.getInterestRate());
                        loanApp.setDurationInMonths(packageEntity.getMaxDuration());
                        loanApp.setStartDate(LocalDate.now());
                        loanApp.setNextPaymentDate(LocalDate.now().plusMonths(1));
                        loanApp.setPurpose(tx.getNarration() != null ? tx.getNarration() : "Loan disbursement");
                        
                        loanApp.setApplicationDate(LocalDateTime.now());
                        loanApp.setReviewDate(LocalDateTime.now());
                        loanApp.setStatus(ApplicationStatus.APPROVED);
                        loanApp.setReviewNotes("Created via Transaction by " + adminName);

                        LoanApplication savedApp = loanAppRepo.save(loanApp);
                        tx.setApplicationId(savedApp.getId());
                        tx.setApplicationType("loan");
                        
                        System.out.println("✅ NEW Loan Created: #" + savedApp.getId());
                    }
                }
                
                // --- 2. FIXED DEPOSIT CREATION (Only if new) ---
                else if ("Fixed Deposit".equals(head)) {
                    FixedDeposit packageEntity = fdPackageRepo.findById(packageId).orElse(null);
                    if (packageEntity != null && access.isForeign(packageEntity.getNetwork(), session)) {
                        return reject(HttpStatus.FORBIDDEN, "Package belongs to another cooperative");
                    }
                    if (packageEntity != null) {
                        FixedDepositApplication fdApp = new FixedDepositApplication();
                        fdApp.setUser(targetUser);
                        fdApp.setFixedDeposit(packageEntity);
                        fdApp.setNetwork(network);
                        fdApp.setDepositAmount(tx.getAmount());
                        fdApp.setTransactionType(txType);
                        
                        Integer term = packageEntity.getMinDuration();
                        if (payload.get("term") != null) {
                            term = Integer.valueOf(payload.get("term").toString());
                        }
                        fdApp.setDepositTerm(term);
                        
                        fdApp.setApplicationDate(LocalDateTime.now());
                        fdApp.setReviewDate(LocalDateTime.now());
                        fdApp.setStatus(ApplicationStatus.APPROVED);
                        fdApp.setReviewNotes("Created via Transaction by " + adminName);
                        
                        FixedDepositApplication savedApp = fdAppRepo.save(fdApp);
                        tx.setApplicationId(savedApp.getId());
                        tx.setApplicationType("fixed-deposit");
                        
                        System.out.println("✅ NEW FD Created: #" + savedApp.getId());
                    }
                }
                
                // --- 3. SAVINGS ACCOUNT CREATION (Only if new) ---
                else if ("Savings".equals(head)) {
                    SavingAccount packageEntity = saPackageRepo.findById(packageId).orElse(null);
                    if (packageEntity != null && access.isForeign(packageEntity.getNetwork(), session)) {
                        return reject(HttpStatus.FORBIDDEN, "Package belongs to another cooperative");
                    }
                    if (packageEntity != null) {
                        SavingAccountApplication saApp = new SavingAccountApplication();
                        saApp.setUser(targetUser);
                        saApp.setSavingAccount(packageEntity);
                        saApp.setNetwork(network);
                        saApp.setInitialDeposit(tx.getAmount());
                        saApp.setTransactionType(txType);
                        
                        saApp.setApplicationDate(LocalDateTime.now());
                        saApp.setReviewDate(LocalDateTime.now());
                        saApp.setStatus(ApplicationStatus.APPROVED);
                        saApp.setReviewNotes("Created via Transaction by " + adminName);

                        SavingAccountApplication savedApp = saAppRepo.save(saApp);
                        tx.setApplicationId(savedApp.getId());
                        tx.setApplicationType("saving-account");
                        
                        System.out.println("✅ NEW Savings Account Created: #" + savedApp.getId());
                    }
                }
            }
            
            // --- EXISTING APPLICATION LINKING ---
            else if (payload.get("applicationId") != null) {
                // If ID exists, just link it. Do NOT create a new Application entity.
                Long applicationId = ((Number) payload.get("applicationId")).longValue();
                String applicationType = (String) payload.get("applicationType");

                if (!applicationBelongsToNetwork(applicationId, applicationType, networkId)) {
                    return reject(HttpStatus.FORBIDDEN, "Application belongs to another cooperative");
                }

                tx.setApplicationId(applicationId);
                tx.setApplicationType(applicationType);
            }

            // ========================================================================
            // END APPLICATION LOGIC
            // ========================================================================

            Transaction savedTx = transactionRepo.save(tx);

            // The journal is the accounting record; the transaction row above stays as the
            // operational one. Both are written in the same transaction, so they cannot diverge.
            ledger.post(network, tx.getDate(),
                    tx.getNarration() != null ? tx.getNarration() : tx.getType(),
                    tx.getVoucherId(), "transaction", savedTx.getId(), adminName,
                    journalLinesFor(tx, targetUser));

            // Record the cooperative's liquid position as it stands once this entry is in.
            // Derived from the ledger inside the same serialised posting, so concurrent
            // tellers can no longer each stamp a figure that ignores the other.
            savedTx.setNetworkReserve(reports.liquidity(networkId));

            // Log Activity
            try {
                String userRole = (String) session.getAttribute("userRole");
                ActivityLog log = new ActivityLog(
                    adminName, 
                    userRole != null ? userRole : "admin", 
                    networkId, 
                    "ADD_TRANSACTION", 
                    "Added " + tx.getType() + " of Rs. " + tx.getAmount()
                );
                logRepo.save(log);
            } catch (Exception e) {}

            // Send voucher email to the user
            try {
                if (targetUser != null && targetUser.getEmail() != null && !targetUser.getEmail().isEmpty()) {
                    emailService.sendTransactionVoucherEmail(targetUser.getEmail(), savedTx, network);
                }
            } catch (Exception e) {
                System.err.println("Email send failed (non-blocking): " + e.getMessage());
            }

            return ResponseEntity.ok(mapTransactionToFrontend(savedTx));

        } catch (Exception e) {
            e.printStackTrace();
            return reject(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }


    /**
     * Chooses how a posted transaction is recorded. A loan repayment against a known loan
     * is split between interest and principal by the repayment schedule; everything else
     * maps straight through.
     */
    private List<LedgerLine> journalLinesFor(Transaction tx, User member) {
        boolean isLoanRepayment = LedgerPostings.LOAN.equals(tx.getAccountHead())
                && "Credit".equalsIgnoreCase(tx.getDirection())
                && "loan".equals(tx.getApplicationType())
                && tx.getApplicationId() != null;

        if (isLoanRepayment) {
            List<RepaymentSchedule> schedule =
                    scheduleRepo.findByLoanApplicationIdOrderByDueDateAsc(tx.getApplicationId());
            if (!schedule.isEmpty()) {
                RepaymentAllocation.Result allocation = RepaymentAllocation.allocate(schedule, tx.getAmount());
                scheduleRepo.saveAll(allocation.touched());
                return LedgerPostings.loanRepayment(member, allocation.principal(), allocation.interest(),
                        allocation.unallocated(), tx.getPaymentMethod(), tx.getType());
            }
        }

        return LedgerPostings.forTransaction(tx.getMode(), tx.getAccountHead(), tx.getDirection(),
                tx.getPaymentMethod(), tx.getNetworkLedger(), tx.getAmount(), member, tx.getType());
    }

    /**
     * Rejects the request and rolls the surrounding transaction back, so no partial
     * money movement survives a failed or refused posting.
     */
    private ResponseEntity<?> reject(HttpStatus status, String message) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
        }
        return ResponseEntity.status(status).body(Map.of("error", message == null ? "Request failed" : message));
    }

    private boolean applicationBelongsToNetwork(Long applicationId, String applicationType, Long networkId) {
        if (applicationId == null || applicationType == null) return false;
        Network owner = switch (applicationType) {
            case "loan" -> loanAppRepo.findById(applicationId).map(LoanApplication::getNetwork).orElse(null);
            case "fixed-deposit" -> fdAppRepo.findById(applicationId).map(FixedDepositApplication::getNetwork).orElse(null);
            case "saving-account" -> saAppRepo.findById(applicationId).map(SavingAccountApplication::getNetwork).orElse(null);
            default -> null;
        };
        return owner != null && networkId.equals(owner.getId());
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