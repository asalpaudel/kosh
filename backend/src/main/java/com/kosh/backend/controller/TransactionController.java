package com.kosh.backend.controller;

import java.time.LocalDate;
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
import com.kosh.backend.model.Network;
import com.kosh.backend.model.Transaction;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.ActivityLogRepository;
import com.kosh.backend.repository.NetworkRepository;
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

    public TransactionController(TransactionRepository transactionRepo, UserRepository userRepo, NetworkRepository networkRepo, ActivityLogRepository logRepo) {
        this.transactionRepo = transactionRepo;
        this.userRepo = userRepo;
        this.networkRepo = networkRepo;
        this.logRepo = logRepo;
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

            if (payload.get("applicationId") != null) {
                tx.setApplicationId(((Number) payload.get("applicationId")).longValue());
                tx.setApplicationType((String) payload.get("applicationType"));
            }

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

            // Handle User Balance Logic
            if (payload.get("userId") != null) {
                Long targetUserId = Long.valueOf(payload.get("userId").toString());
                User targetUser = userRepo.findById(targetUserId.intValue())
                        .orElseThrow(() -> new RuntimeException("User not found"));
                
                tx.setUser(targetUser);
                tx.setUserName(targetUser.getName());

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
                tx.setUserName((String) payload.get("userName"));
            }

            tx.setNetwork(network);

            // --- CALCULATE & SET RESERVE ---
            Double totalSavings = transactionRepo.getBalanceByHead(networkId, "Savings");
            Double totalFD = transactionRepo.getBalanceByHead(networkId, "Fixed Deposit");
            Double totalLoans = transactionRepo.getOutstandingLoans(networkId);
            Double totalNetwork = transactionRepo.getNetworkBalance(networkId); // ⭐ Include Network Balance
            
            // Adjust current values based on THIS transaction before saving
            String head = tx.getAccountHead();
            String dir = tx.getDirection();
            Double amt = tx.getAmount();
            String mode = tx.getMode();

            if ("Savings".equals(head)) {
                totalSavings += ("Credit".equals(dir) ? amt : -amt);
            } else if ("Fixed Deposit".equals(head)) {
                totalFD += ("Credit".equals(dir) ? amt : -amt);
            } else if ("Loan".equals(head)) {
                totalLoans += ("Credit".equals(dir) ? amt : -amt);
            }

            // Adjust Network Balance
            if ("network".equals(mode)) {
                totalNetwork += ("Credit".equals(dir) ? amt : -amt);
            }

            // Reserve = (Member Deposits - Loans) + Network Net Position
            Double reserve = (totalSavings + totalFD) - totalLoans + totalNetwork;
            tx.setNetworkReserve(reserve);

            Transaction savedTx = transactionRepo.save(tx);

            // Log
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