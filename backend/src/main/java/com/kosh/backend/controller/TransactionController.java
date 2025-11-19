package com.kosh.backend.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus; 
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.kosh.backend.model.Transaction;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.TransactionRepository; 
import com.kosh.backend.repository.UserRepository;
import com.kosh.backend.util.SessionUtil;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"}, allowCredentials = "true")
public class TransactionController {

    @Autowired
    private TransactionRepository repo;

    @Autowired
    private UserRepository userRepo; 

    public static class TransactionRequest {
        private Integer userId;
        private String userName; 
        private String type;
        private Double amountValue; 

        public Integer getUserId() { return userId; }
        public void setUserId(Integer userId) { this.userId = userId; }
        public String getUserName() { return userName; }
        public void setUserName(String userName) { this.userName = userName; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public Double getAmountValue() { return amountValue; }
        public void setAmountValue(Double amountValue) { this.amountValue = amountValue; }
    }

    @GetMapping
    public ResponseEntity<?> getAllTransactions(HttpSession session) {
        // Only admin can view transactions
        if (!SessionUtil.isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only admin can view transactions");
        }

        List<Transaction> transactions = repo.findAll();
        return ResponseEntity.ok(transactions);
    }

    @PostMapping
    public ResponseEntity<?> createTransaction(
            @RequestBody TransactionRequest req,
            HttpSession session) {
        
        // Only admin can create transactions
        if (!SessionUtil.isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only admin can create transactions");
        }

        try {
            System.out.println("=== POST /api/transactions ===");
            System.out.println("Admin: " + SessionUtil.getUserEmail(session));
            System.out.println("Transaction for UserID: " + req.getUserId() + " amount: " + req.getAmountValue());

            User user = userRepo.findById(req.getUserId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

            // Verify user belongs to admin's sahakari
            Long adminSahakariId = SessionUtil.getSahakariId(session);
            // You'll need to add logic to verify user's sahakari matches admin's

            Double currentBalance = user.getBalance() != null ? user.getBalance() : 0.0;
            Double txAmount = req.getAmountValue();
            String txType = req.getType();

            if ("Deposit".equals(txType) || "Interest Added".equals(txType) || "Loan Payment".equals(txType)) {
                user.setBalance(currentBalance + txAmount);
            } else if ("Withdrawal".equals(txType)) {
                if (currentBalance < txAmount) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                            "Insufficient funds. Balance: " + currentBalance);
                }
                user.setBalance(currentBalance - txAmount);
            }

            userRepo.save(user);
            System.out.println("User balance updated. New balance: " + user.getBalance());

            Transaction newTransaction = new Transaction();
            newTransaction.setTransactionId(UUID.randomUUID().toString());            
            newTransaction.setDate(LocalDate.now().toString());
            newTransaction.setUserId(req.getUserId());
            newTransaction.setUser(req.getUserName()); 
            newTransaction.setType(txType);
            
            String formattedAmount = String.format(new Locale("en", "NP"), "Rs. %.2f", txAmount);
            newTransaction.setAmount(formattedAmount); 

            Transaction saved = repo.save(newTransaction);
            
            System.out.println("SUCCESS: Transaction created by admin: " + SessionUtil.getUserEmail(session));
            return ResponseEntity.ok(saved);

        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(null); 
        } catch (Exception e) {
            System.out.println("ERROR in createTransaction: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}