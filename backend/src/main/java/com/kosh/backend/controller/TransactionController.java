package com.kosh.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kosh.backend.model.Transaction;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.TransactionRepository;
import com.kosh.backend.repository.UserRepository;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionRepository repo;
    private final UserRepository userRepo;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public TransactionController(TransactionRepository repo, UserRepository userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    @PostMapping
    public ResponseEntity<?> createTransaction(@RequestBody Map<String, Object> rawTx,
            HttpSession session)
            throws Exception {

        System.out.println("========== TRANSACTION CREATE DEBUG ==========");
        System.out.println("Session ID: " + session.getId());

        // Get session attributes with detailed logging
        Object sahakariIdObj = session.getAttribute("sahakariId");
        String sahakari = (String) session.getAttribute("sahakari");
        String userEmail = (String) session.getAttribute("userEmail");

        System.out.println("Session userEmail: " + userEmail);
        System.out.println("Session sahakari: " + sahakari);
        System.out.println("Session sahakariId: " + sahakariIdObj);

        // Check if user is logged in first
        if (userEmail == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Not authenticated. Please login again."));
        }

        // Convert sahakariId properly
        Long sahakariId = null;
        if (sahakariIdObj != null) {
            if (sahakariIdObj instanceof Integer) {
                sahakariId = ((Integer) sahakariIdObj).longValue();
            } else if (sahakariIdObj instanceof Long) {
                sahakariId = (Long) sahakariIdObj;
            }
        }

        // If sahakari is missing but user is logged in, try to get it from the user
        if (sahakari == null) {
            // Get current user's sahakari from database
            User currentUser = userRepo.findByEmail(userEmail);
            if (currentUser != null) {
                sahakari = currentUser.getSahakari();
                System.out.println("Retrieved sahakari from user database: " + sahakari);
            }
        }

        // Final validation
        if (sahakari == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Sahakari information not found in session. Please logout and login again."));
        }

        // Extract details map first to determine transaction direction
        @SuppressWarnings("unchecked")
        Map<String, Object> details = (Map<String, Object>) rawTx.get("details");
        String mode = details != null ? (String) details.get("mode") : "member";
        String direction = details != null ? (String) details.get("direction") : "Credit";
        String accountHead = details != null ? (String) details.get("accountHead") : "";

        System.out.println("Mode: " + mode);
        System.out.println("Direction: " + direction);
        System.out.println("Account Head: " + accountHead);

        // Determine transaction type (must be one of: Savings, Fixed Deposit, Loan,
        // Interest)
        String transactionType = determineTransactionType(mode, accountHead, direction);
        System.out.println("Transaction Type: " + transactionType);

        Transaction tx = new Transaction();
        tx.setSahakariId(sahakariId);
        tx.setNetworkId(sahakariId);
        tx.setVoucherId((String) rawTx.get("voucherId"));
        tx.setDate((String) rawTx.get("date"));
        tx.setStatus("Success");
        tx.setNarration((String) rawTx.get("narration"));
        tx.setType(transactionType); // Set the normalized type

        // Handle userId - could be null for network transactions
        Object userIdObj = rawTx.get("userId");
        if (userIdObj != null) {
            tx.setUserId(((Number) userIdObj).intValue());
        }
        tx.setUserName((String) rawTx.get("userName"));

        // Calculate amount with correct sign
        double amount = rawTx.get("amountValue") != null
                ? ((Number) rawTx.get("amountValue")).doubleValue()
                : 0.0;

        // Apply sign based on direction:
        // Credit = Positive (money coming in)
        // Debit = Negative (money going out)
        if ("Debit".equals(direction)) {
            amount = -Math.abs(amount);
        } else { // Credit
            amount = Math.abs(amount);
        }

        System.out.println("Amount after sign adjustment: " + amount);
        tx.setAmountValue(amount);

        // Store full JSON data
        tx.setDetailsJson(objectMapper.writeValueAsString(rawTx));

        // ---- Update User Balance (only for member transactions) ----
        if (tx.getUserId() != null) {
            User user = userRepo.findById(tx.getUserId()).orElse(null);

            if (user != null) {
                // Verify user belongs to the same sahakari
                if (!user.getSahakari().equals(sahakari)) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "User does not belong to your network"));
                }

                double currentBalance = user.getBalance() != null ? user.getBalance() : 0.0;
                double newBalance = currentBalance + amount;

                System.out.println("Current Balance: " + currentBalance);
                System.out.println("Transaction Amount: " + amount);
                System.out.println("New Balance: " + newBalance);

                // Prevent overdraft for withdrawals
                if (amount < 0 && newBalance < 0) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Insufficient balance. Current: Rs. " + currentBalance));
                }

                user.setBalance(newBalance);
                userRepo.save(user);

                System.out.println("User balance updated successfully");
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }
        }

        repo.save(tx);
        System.out.println("Transaction saved with ID: " + tx.getId());
        System.out.println("==============================================");

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Transaction created successfully");
        response.put("transactionId", tx.getId());
        if (tx.getUserId() != null) {
            User updatedUser = userRepo.findById(tx.getUserId()).orElse(null);
            if (updatedUser != null) {
                response.put("newBalance", updatedUser.getBalance());
            }
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Determines the transaction type based on mode, account head, and direction.
     * Must return one of: "Savings", "Fixed Deposit", "Loan", "Interest"
     */
    private String determineTransactionType(String mode, String accountHead, String direction) {
        if ("member".equals(mode)) {
            // Member transactions - extract from accountHead
            if (accountHead.toLowerCase().contains("savings")) {
                return "Savings";
            } else if (accountHead.toLowerCase().contains("fixed deposit")
                    || accountHead.toLowerCase().contains("fd")) {
                return "Fixed Deposit";
            } else if (accountHead.toLowerCase().contains("recurring deposit")
                    || accountHead.toLowerCase().contains("rd")) {
                return "Fixed Deposit"; // Treat RD as Fixed Deposit
            } else if (accountHead.toLowerCase().contains("loan")) {
                return "Loan";
            } else {
                return "Savings"; // Default for member transactions
            }
        } else {
            // Network transactions - determine based on income/expense
            if (accountHead.toLowerCase().contains("income")) {
                return "Interest"; // Income is typically interest
            } else if (accountHead.toLowerCase().contains("expense")) {
                return "Savings"; // Expenses come from savings/cash
            } else if (accountHead.toLowerCase().contains("interest")) {
                return "Interest";
            } else {
                return "Savings"; // Default for network transactions
            }
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getTransactionsForUser(@PathVariable Integer userId, HttpSession session) {
        String sahakari = (String) session.getAttribute("sahakari");
        String userEmail = (String) session.getAttribute("userEmail");

        if (userEmail == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        if (sahakari == null) {
            // Try to get from user database
            User currentUser = userRepo.findByEmail(userEmail);
            if (currentUser != null) {
                sahakari = currentUser.getSahakari();
            } else {
                return ResponseEntity.status(401).body(Map.of("error", "Sahakari not found in session"));
            }
        }

        // Verify user belongs to network
        User user = userRepo.findById(userId).orElse(null);
        if (user == null || !user.getSahakari().equals(sahakari)) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found or access denied"));
        }

        return ResponseEntity.ok(repo.findByUserId(userId));
    }

    @GetMapping("/sahakari")
    public ResponseEntity<?> getTransactionsForSahakari(HttpSession session) {
        Object sahakariIdObj = session.getAttribute("sahakariId");

        if (sahakariIdObj == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Session data not found"));
        }

        Long sahakariId = null;
        if (sahakariIdObj instanceof Integer) {
            sahakariId = ((Integer) sahakariIdObj).longValue();
        } else if (sahakariIdObj instanceof Long) {
            sahakariId = (Long) sahakariIdObj;
        }

        // Get transactions for this sahakari only
        return ResponseEntity.ok(repo.findBySahakariId(sahakariId));
    }

    @GetMapping("/balance/{userId}")
    public ResponseEntity<?> getBalance(@PathVariable Integer userId, HttpSession session) {
        String sahakari = (String) session.getAttribute("sahakari");
        String userEmail = (String) session.getAttribute("userEmail");

        if (userEmail == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        if (sahakari == null) {
            // Try to get from user database
            User currentUser = userRepo.findByEmail(userEmail);
            if (currentUser != null) {
                sahakari = currentUser.getSahakari();
            } else {
                return ResponseEntity.status(401).body(Map.of("error", "Sahakari not found in session"));
            }
        }

        User user = userRepo.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }

        // Verify user belongs to network
        if (!user.getSahakari().equals(sahakari)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Access denied"));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("balance", user.getBalance() != null ? user.getBalance() : 0.0);
        response.put("userId", user.getId());
        response.put("userName", user.getName());

        return ResponseEntity.ok(response);
    }
}