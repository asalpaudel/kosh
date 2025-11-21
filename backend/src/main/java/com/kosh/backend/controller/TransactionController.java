package com.kosh.backend.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus; 
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping; 
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.kosh.backend.model.Transaction;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.TransactionRepository; 
import com.kosh.backend.repository.UserRepository;

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
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        List<Transaction> transactions = repo.findAll();
        return ResponseEntity.ok(transactions);
    }

    @PostMapping
    public ResponseEntity<Transaction> createTransaction(@RequestBody TransactionRequest req) {
        try {
            System.out.println("=== POST /api/transactions ===");
            System.out.println("Received request for UserID: " + req.getUserId() + " for amount: " + req.getAmountValue());

            User user = userRepo.findById(req.getUserId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

            Double currentBalance = user.getBalance() != null ? user.getBalance() : 0.0;
            
            Double txAmount = req.getAmountValue();
            String txType = req.getType();

            if ("Deposit".equals(txType) || "Interest Added".equals(txType) || "Loan Payment".equals(txType)) {

                user.setBalance(currentBalance + txAmount);
            } else if ("Withdrawal".equals(txType)) {

                if (currentBalance < txAmount) {

                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient funds. Balance: " + currentBalance);
                }
                user.setBalance(currentBalance - txAmount);
            } else {
                System.out.println("Transaction type '" + txType + "' does not affect balance.");
            }

            userRepo.save(user);
            System.out.println("User balance updated. New balance: " + user.getBalance());

            Transaction newTransaction = new Transaction();
            
            newTransaction.setTransactionId(UUID.randomUUID().toString());            
            newTransaction.setDate(LocalDate.now().toString());
            newTransaction.setUserId(req.getUserId());
            newTransaction.setUser(req.getUserName()); 
            newTransaction.setType(txType);
            
            String formattedAmount = String.format(new Locale("en", "NP"), "Rs. %f", txAmount);
            
            newTransaction.setAmount(formattedAmount); 

            Transaction saved = repo.save(newTransaction);
            
            System.out.println("SUCCESS: Saved Transaction log with ID: " + saved.getId() + " (TxID: " + saved.getTransactionId() + ")");
            return ResponseEntity.ok(saved);

        } catch (ResponseStatusException e) {
            System.out.println("ERROR in createTransaction: " + e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null); 
        } catch (Exception e) {
            System.out.println("ERROR in createTransaction: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}