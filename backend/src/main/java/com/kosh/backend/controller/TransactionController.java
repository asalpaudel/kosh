package com.kosh.backend.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
import com.kosh.backend.service.MemberNotificationService;
import com.kosh.backend.ledger.LedgerLine;
import com.kosh.backend.ledger.LedgerPostings;
import com.kosh.backend.ledger.LedgerReports;
import com.kosh.backend.ledger.LedgerService;
import com.kosh.backend.service.Money;
import com.kosh.backend.service.RepaymentAllocation;
import com.kosh.backend.service.NetworkAccessService;
import com.kosh.backend.service.LoanSecurityService;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private static final Logger LOGGER = LoggerFactory.getLogger(TransactionController.class);

    private static final BigDecimal MAX_TRANSACTION_AMOUNT =
            new BigDecimal("9999999999999999.99");

    private final TransactionRepository transactionRepo;
    private final UserRepository userRepo;
    private final NetworkRepository networkRepo;
    private final ActivityLogRepository logRepo;
    private final MemberNotificationService notifications;

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
    private final LoanSecurityService loanSecurity;

    public TransactionController(
            TransactionRepository transactionRepo, 
            UserRepository userRepo, 
            NetworkRepository networkRepo, 
            ActivityLogRepository logRepo,
            MemberNotificationService notifications,
            FixedDepositApplicationRepository fdAppRepo,
            FixedDepositRepository fdPackageRepo,
            LoanApplicationRepository loanAppRepo,
            LoanPackageRepository loanPackageRepo,
            SavingAccountApplicationRepository saAppRepo,
            SavingAccountRepository saPackageRepo,
            NetworkAccessService access,
            LedgerService ledger,
            LedgerReports reports,
            RepaymentScheduleRepository scheduleRepo,
            LoanSecurityService loanSecurity) {

        this.access = access;
        this.ledger = ledger;
        this.reports = reports;
        this.scheduleRepo = scheduleRepo;
        this.loanSecurity = loanSecurity;

        this.transactionRepo = transactionRepo;
        this.userRepo = userRepo;
        this.networkRepo = networkRepo;
        this.logRepo = logRepo;
        this.notifications = notifications;
        
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

            String idempotencyKey = payload.get("idempotencyKey") instanceof String key ? key.trim() : "";
            try {
                UUID.fromString(idempotencyKey);
            } catch (IllegalArgumentException exception) {
                return reject(HttpStatus.BAD_REQUEST, "A valid idempotency key is required");
            }
            String fingerprint = requestFingerprint(networkId, payload);

            // Serialize submissions per cooperative. A concurrent retry waits here, then
            // observes the first committed transaction instead of posting money twice.
            networkRepo.lockForPosting(networkId);
            var replay = transactionRepo.findByNetworkIdAndIdempotencyKey(networkId, idempotencyKey);
            if (replay.isPresent()) {
                if (!fingerprint.equals(replay.get().getRequestFingerprint())) {
                    return reject(HttpStatus.CONFLICT, "Idempotency key was already used for another operation");
                }
                return ResponseEntity.ok(mapTransactionToFrontend(replay.get()));
            }

            Network network = networkRepo.findById(networkId)
                .orElseThrow(() -> new RuntimeException("Network not found"));

            Transaction tx = new Transaction();
            tx.setIdempotencyKey(idempotencyKey);
            tx.setRequestFingerprint(fingerprint);
            User maker = userRepo.getReferenceById(adminId);
            if (maker == null) { // Keeps the controller testable with a plain repository mock.
                maker = new User(); maker.setId(adminId); maker.setName(adminName);
            }
            tx.setMaker(maker); tx.setMadeAt(Instant.now());
            
            // Basic Mapping
            // The cooperative's own entries carry no member voucher book, but every row
            // still needs a reference an operator can quote back.
            String voucherId = (String) payload.get("voucherId");
            tx.setVoucherId(voucherId != null && !voucherId.isBlank()
                    ? voucherId
                    : "NET-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            tx.setStatus("Success");
            tx.setType((String) payload.get("type"));
            tx.setAmount(Money.of(payload.get("amountValue")));
            // A negative amount flips the direction of the posting: a "Debit" of -5000 passes
            // the sufficient-funds check below and then credits the member instead.
            if (tx.getAmount() == null || tx.getAmount().signum() <= 0
                    || tx.getAmount().compareTo(MAX_TRANSACTION_AMOUNT) > 0) {
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
            if (!"Credit".equals(tx.getDirection()) && !"Debit".equals(tx.getDirection())) {
                return reject(HttpStatus.BAD_REQUEST, "Direction must be Credit or Debit");
            }
            if (!"member".equals(tx.getMode()) && !"network".equals(tx.getMode())) {
                return reject(HttpStatus.BAD_REQUEST, "Mode must be member or network");
            }
            if (tx.getAccountHead() == null || tx.getAccountHead().isBlank()
                    || tx.getAccountHead().length() > 255) {
                return reject(HttpStatus.BAD_REQUEST, "A valid account head is required");
            }
            if ("member".equals(tx.getMode()) && payload.get("userId") == null) {
                return reject(HttpStatus.BAD_REQUEST, "Member transactions require a member");
            }

            // Handle User Mapping
            User targetUser = null;
            if (payload.get("userId") != null) {
                Long targetUserId = Long.valueOf(payload.get("userId").toString());
                targetUser = userRepo.findById(targetUserId)
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

            // Resolve every reference before a high-value item enters the approval queue.
            // Pending transactions are inert, but they must still be valid tenant-owned requests.
            if (payload.get("applicationId") != null) {
                Long applicationId = Long.valueOf(payload.get("applicationId").toString());
                String applicationType = (String) payload.get("applicationType");
                if (!applicationBelongsToNetwork(applicationId, applicationType, networkId)) {
                    return reject(HttpStatus.FORBIDDEN, "Application belongs to another cooperative");
                }
                if (LedgerPostings.LOAN.equals(tx.getAccountHead())
                        && !approvedSecuredLoan(applicationId, applicationType)) {
                    return reject(HttpStatus.BAD_REQUEST,
                            "Loan transaction requires an approved application with pledged collateral");
                }
                tx.setApplicationId(applicationId); tx.setApplicationType(applicationType);
            }
            if (payload.get("packageId") != null) {
                Long packageId = Long.valueOf(payload.get("packageId").toString());
                tx.setPackageId(packageId);
                if (payload.get("term") != null) tx.setRequestedTerm(Integer.valueOf(payload.get("term").toString()));
            }
            if ("Loan".equals(tx.getAccountHead()) && tx.getApplicationId() == null) {
                return reject(HttpStatus.BAD_REQUEST,
                        "Loan disbursement must reference an approved secured loan application");
            }

            if (tx.getAmount().compareTo(network.getMakerCheckerThreshold()) > 0) {
                if (tx.getPackageId() != null
                        && !packageBelongsToNetwork(tx.getPackageId(), tx.getAccountHead(), networkId)) {
                    return reject(HttpStatus.FORBIDDEN, "Package belongs to another cooperative");
                }
                tx.setStatus("Frozen"); tx.setApprovalStatus("PENDING");
                Transaction pending = transactionRepo.save(tx);
                logDecision(adminName, "admin", networkId, "SUBMIT_TRANSACTION",
                        "Submitted voucher " + tx.getVoucherId() + " for independent approval");
                return ResponseEntity.ok(mapTransactionToFrontend(pending));
            }
            tx.setApprovalStatus("NOT_REQUIRED");

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
                        
                        loanApp.setApplicationDate(Instant.now());
                        loanApp.setReviewDate(Instant.now());
                        loanApp.setStatus(ApplicationStatus.APPROVED);
                        loanApp.setReviewNotes("Created via Transaction by " + adminName);

                        LoanApplication savedApp = loanAppRepo.save(loanApp);
                        tx.setApplicationId(savedApp.getId());
                        tx.setApplicationType("loan");
                        
                        LOGGER.info("Loan application created from a transaction");
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
                        
                        fdApp.setApplicationDate(Instant.now());
                        fdApp.setReviewDate(Instant.now());
                        fdApp.setStatus(ApplicationStatus.APPROVED);
                        fdApp.setReviewNotes("Created via Transaction by " + adminName);
                        
                        FixedDepositApplication savedApp = fdAppRepo.save(fdApp);
                        tx.setApplicationId(savedApp.getId());
                        tx.setApplicationType("fixed-deposit");
                        
                        LOGGER.info("Fixed-deposit application created from a transaction");
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
                        
                        saApp.setApplicationDate(Instant.now());
                        saApp.setReviewDate(Instant.now());
                        saApp.setStatus(ApplicationStatus.APPROVED);
                        saApp.setReviewNotes("Created via Transaction by " + adminName);

                        SavingAccountApplication savedApp = saAppRepo.save(saApp);
                        tx.setApplicationId(savedApp.getId());
                        tx.setApplicationType("saving-account");
                        
                        LOGGER.info("Savings application created from a transaction");
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
            } catch (Exception e) {
                LOGGER.warn("Unable to persist ADD_TRANSACTION audit event");
            }

            // Send voucher email to the user
            try {
                if (targetUser != null && targetUser.getEmail() != null && !targetUser.getEmail().isEmpty()) {
                    notifications.sendTransactionVoucher(targetUser, savedTx, network);
                }
            } catch (Exception e) {
                LOGGER.warn("Unable to send transaction voucher email");
            }

            return ResponseEntity.ok(mapTransactionToFrontend(savedTx));

        } catch (Exception e) {
            return reject(HttpStatus.BAD_REQUEST, "Transaction request is invalid");
        }
    }

    @PostMapping("/{id}/approve")
    @Transactional
    public ResponseEntity<?> approveTransaction(@PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> request, HttpSession session) {
        try {
            Long checkerId = (Long) session.getAttribute("userId");
            Long networkId = (Long) session.getAttribute("sahakariId");
            String checkerName = (String) session.getAttribute("userName");
            if (checkerId == null || networkId == null) return reject(HttpStatus.UNAUTHORIZED, "Not authenticated");
            Transaction tx = transactionRepo.findByIdForApproval(id)
                    .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));
            if (!networkId.equals(tx.getNetwork().getId())) return reject(HttpStatus.FORBIDDEN, "Cross-tenant access denied");
            if (!"PENDING".equals(tx.getApprovalStatus())) return reject(HttpStatus.CONFLICT, "Transaction is not pending approval");
            if (tx.getMaker() == null || checkerId.equals(tx.getMaker().getId())) {
                return reject(HttpStatus.CONFLICT, "Maker and checker must be different users");
            }
            User checker = userRepo.findById(checkerId)
                    .orElseThrow(() -> new IllegalArgumentException("Checker account not found"));
            if (!networkId.equals(checker.getSahakariId()) || !"admin".equalsIgnoreCase(checker.getRole())) {
                return reject(HttpStatus.FORBIDDEN, "Checker must be an administrator of this cooperative");
            }
            networkRepo.lockForPosting(networkId);
            String notes = decisionNotes(request);
            postPending(tx, checker, checkerName, notes);
            return ResponseEntity.ok(mapTransactionToFrontend(tx));
        } catch (IllegalArgumentException exception) {
            return reject(HttpStatus.BAD_REQUEST, exception.getMessage());
        } catch (Exception exception) {
            return reject(HttpStatus.BAD_REQUEST, "Transaction approval failed");
        }
    }

    @PostMapping("/{id}/reject")
    @Transactional
    public ResponseEntity<?> rejectTransaction(@PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> request, HttpSession session) {
        try {
            Long checkerId = (Long) session.getAttribute("userId");
            Long networkId = (Long) session.getAttribute("sahakariId");
            String checkerName = (String) session.getAttribute("userName");
            if (checkerId == null || networkId == null) return reject(HttpStatus.UNAUTHORIZED, "Not authenticated");
            Transaction tx = transactionRepo.findByIdForApproval(id)
                    .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));
            if (!networkId.equals(tx.getNetwork().getId())) return reject(HttpStatus.FORBIDDEN, "Cross-tenant access denied");
            if (!"PENDING".equals(tx.getApprovalStatus())) return reject(HttpStatus.CONFLICT, "Transaction is not pending approval");
            if (tx.getMaker() == null || checkerId.equals(tx.getMaker().getId())) {
                return reject(HttpStatus.CONFLICT, "Maker and checker must be different users");
            }
            User checker = userRepo.findById(checkerId)
                    .orElseThrow(() -> new IllegalArgumentException("Checker account not found"));
            if (!networkId.equals(checker.getSahakariId()) || !"admin".equalsIgnoreCase(checker.getRole())) {
                return reject(HttpStatus.FORBIDDEN, "Checker must be an administrator of this cooperative");
            }
            tx.setApprovalStatus("REJECTED"); tx.setChecker(checker); tx.setCheckedAt(Instant.now());
            tx.setCheckerNotes(decisionNotes(request)); transactionRepo.save(tx);
            logDecision(checkerName, "admin", networkId, "REJECT_TRANSACTION",
                    "Rejected pending voucher " + tx.getVoucherId());
            return ResponseEntity.ok(mapTransactionToFrontend(tx));
        } catch (IllegalArgumentException exception) {
            return reject(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
    }

    private void postPending(Transaction tx, User checker, String checkerName, String notes) {
        User member = tx.getUser(); Network network = tx.getNetwork();
        if (member != null && !LedgerPostings.LOAN.equals(tx.getAccountHead())) {
            BigDecimal balance = member.getBalance();
            if ("Credit".equals(tx.getDirection())) member.setBalance(balance.add(tx.getAmount()));
            else {
                if (balance.compareTo(tx.getAmount()) < 0) throw new IllegalArgumentException("Insufficient user balance");
                member.setBalance(balance.subtract(tx.getAmount()));
            }
            userRepo.save(member);
        }
        createPendingApplication(tx, checkerName);
        tx.setStatus("Success"); tx.setApprovalStatus("APPROVED"); tx.setChecker(checker);
        tx.setCheckedAt(Instant.now()); tx.setCheckerNotes(notes); transactionRepo.save(tx);
        ledger.post(network, tx.getDate(), tx.getNarration() == null ? tx.getType() : tx.getNarration(),
                tx.getVoucherId(), "transaction", tx.getId(), checkerName, journalLinesFor(tx, member));
        tx.setNetworkReserve(reports.liquidity(network.getId())); transactionRepo.save(tx);
        logDecision(checkerName, "admin", network.getId(), "APPROVE_TRANSACTION",
                "Approved voucher " + tx.getVoucherId() + " made by " + tx.getMaker().getName());
        if (member != null) {
            try { notifications.sendTransactionVoucher(member, tx, network); }
            catch (Exception exception) { LOGGER.warn("Unable to send approved transaction voucher"); }
        }
    }

    private void createPendingApplication(Transaction tx, String checkerName) {
        if (tx.getApplicationId() != null || tx.getPackageId() == null || tx.getUser() == null) return;
        TransactionType type = LedgerPostings.LOAN.equals(tx.getAccountHead())
                ? ("Debit".equals(tx.getDirection()) ? TransactionType.DEPOSIT : TransactionType.WITHDRAW)
                : ("Credit".equals(tx.getDirection()) ? TransactionType.DEPOSIT : TransactionType.WITHDRAW);
        if (LedgerPostings.SAVINGS.equals(tx.getAccountHead())) {
            SavingAccount product = saPackageRepo.findById(tx.getPackageId())
                    .orElseThrow(() -> new IllegalArgumentException("Savings product not found"));
            SavingAccountApplication value = new SavingAccountApplication(); value.setUser(tx.getUser());
            value.setSavingAccount(product); value.setNetwork(tx.getNetwork()); value.setInitialDeposit(tx.getAmount());
            value.setTransactionType(type); value.setApplicationDate(Instant.now()); value.setReviewDate(Instant.now());
            value.setStatus(ApplicationStatus.APPROVED); value.setReviewNotes("Checked by " + checkerName);
            tx.setApplicationId(saAppRepo.save(value).getId()); tx.setApplicationType("saving-account");
        } else if (LedgerPostings.FIXED_DEPOSIT.equals(tx.getAccountHead())) {
            FixedDeposit product = fdPackageRepo.findById(tx.getPackageId())
                    .orElseThrow(() -> new IllegalArgumentException("Fixed-deposit product not found"));
            FixedDepositApplication value = new FixedDepositApplication(); value.setUser(tx.getUser());
            value.setFixedDeposit(product); value.setNetwork(tx.getNetwork()); value.setDepositAmount(tx.getAmount());
            value.setDepositTerm(tx.getRequestedTerm() == null ? product.getMinDuration() : tx.getRequestedTerm());
            value.setTransactionType(type); value.setApplicationDate(Instant.now()); value.setReviewDate(Instant.now());
            value.setStatus(ApplicationStatus.APPROVED); value.setReviewNotes("Checked by " + checkerName);
            tx.setApplicationId(fdAppRepo.save(value).getId()); tx.setApplicationType("fixed-deposit");
        }
    }

    private String decisionNotes(Map<String, Object> request) {
        String notes = request == null || request.get("notes") == null ? null : request.get("notes").toString().trim();
        if (notes != null && notes.length() > 1000) throw new IllegalArgumentException("Checker notes are too long");
        return notes == null || notes.isEmpty() ? null : notes;
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
                loanSecurity.releaseIfClosed(schedule.get(0).getLoanApplication(),
                        tx.getReceivedBy() == null ? "System repayment" : tx.getReceivedBy());
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

    private boolean approvedSecuredLoan(Long applicationId, String applicationType) {
        if (!"loan".equals(applicationType)) return false;
        return loanAppRepo.findById(applicationId)
                .filter(value -> value.getStatus() == ApplicationStatus.APPROVED)
                .filter(value -> loanSecurity.isSecuredLoan(value.getId()))
                .isPresent();
    }

    private boolean packageBelongsToNetwork(Long packageId, String accountHead, Long networkId) {
        Network owner = switch (accountHead == null ? "" : accountHead) {
            case LedgerPostings.SAVINGS -> saPackageRepo.findById(packageId).map(SavingAccount::getNetwork).orElse(null);
            case LedgerPostings.FIXED_DEPOSIT -> fdPackageRepo.findById(packageId).map(FixedDeposit::getNetwork).orElse(null);
            case LedgerPostings.LOAN -> loanPackageRepo.findById(packageId).map(LoanPackage::getNetwork).orElse(null);
            default -> null;
        };
        return owner != null && networkId.equals(owner.getId());
    }

    private void logDecision(String actor, String role, Long networkId, String action, String details) {
        try { logRepo.save(new ActivityLog(actor, role, networkId, action, details)); }
        catch (Exception exception) { LOGGER.warn("Unable to persist transaction control audit event"); }
    }

    String requestFingerprint(Long networkId, Map<String, Object> payload) {
        Object rawDetails = payload.get("details");
        Map<?, ?> details = rawDetails instanceof Map<?, ?> map ? map : Map.of();
        String canonical = String.join("|",
                safe(networkId),
                safe(payload.get("userId")),
                safe(payload.get("amountValue")),
                safe(payload.get("date")),
                safe(payload.get("packageId")),
                safe(payload.get("applicationId")),
                safe(payload.get("applicationType")),
                safe(details.get("mode")),
                safe(details.get("accountHead")),
                safe(details.get("direction")),
                safe(details.get("networkLedger")),
                safe(details.get("paymentMethod")));
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(canonical.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 is unavailable", impossible);
        }
    }

    private String safe(Object value) {
        return value == null ? "" : value.toString().trim();
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
        map.put("approvalStatus", tx.getApprovalStatus());
        map.put("makerId", tx.getMaker() == null ? null : tx.getMaker().getId());
        map.put("makerName", tx.getMaker() == null ? null : tx.getMaker().getName());
        map.put("madeAt", tx.getMadeAt());
        map.put("checkerId", tx.getChecker() == null ? null : tx.getChecker().getId());
        map.put("checkerName", tx.getChecker() == null ? null : tx.getChecker().getName());
        map.put("checkedAt", tx.getCheckedAt());
        map.put("checkerNotes", tx.getCheckerNotes());
        
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
