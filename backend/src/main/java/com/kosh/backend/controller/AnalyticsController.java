package com.kosh.backend.controller;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosh.backend.model.Transaction;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.repository.TransactionRepository;
import com.kosh.backend.repository.UserRepository;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173" }, allowCredentials = "true")
public class AnalyticsController {

    private final NetworkRepository networkRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public AnalyticsController(NetworkRepository networkRepository, 
                               TransactionRepository transactionRepository, 
                               UserRepository userRepository) {
        this.networkRepository = networkRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    // Monthly revenue per type
    @GetMapping("/monthly-revenue")
    public List<Map<String, Object>> getMonthlyRevenue() {
        List<Object[]> result = networkRepository.getMonthlyRevenueByType();
        List<Map<String, Object>> response = new ArrayList<>();

        for (Object[] row : result) {
            Map<String, Object> map = new HashMap<>();
            map.put("month", row[0]);
            map.put("basic", ((Number) row[1]).doubleValue());
            map.put("premium", ((Number) row[2]).doubleValue());
            map.put("custom", ((Number) row[3]).doubleValue());
            response.add(map);
        }

        return response;
    }

    // Total revenue by type (for percentages)
    @GetMapping("/total-revenue")
    public Map<String, Double> getTotalRevenue() {
        List<Object[]> result = networkRepository.getTotalRevenueByType();
        Map<String, Double> totals = new HashMap<>();
        // Initialize all keys to 0
        totals.put("basic", 0.0);
        totals.put("premium", 0.0);
        totals.put("custom", 0.0);

        for (Object[] row : result) {
            String key = ((String) row[0]).toLowerCase();
            Number value = (Number) row[1];
            if (value != null) {
                totals.put(key, value.doubleValue());
            }
        }
        return totals;
    }

    // Admin Dashboard Stats
    @GetMapping("/admin/stats")
    public ResponseEntity<?> getAdminStats(HttpSession session) {
        Long networkId = (Long) session.getAttribute("sahakariId");
        String sahakariName = (String) session.getAttribute("sahakari");

        if (networkId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        // --- 1. GENERAL COUNTS ---
        
        // Fetch Users
        List<User> users = new ArrayList<>();
        if (sahakariName != null) {
            users = userRepository.findBySahakari(sahakariName);
        }
        long userCount = users.size();
        
        // Fetch Transactions
        List<Transaction> transactions = transactionRepository.findByNetworkIdOrderByDateDesc(networkId);
        long txCount = transactions.size();

        // --- 2. FINANCIALS (Balances) ---

        // A. Savings (Liquid Funds from Users)
        Double savings = userRepository.getTotalUserBalanceByNetwork(networkId);
        if (savings == null) savings = 0.0;

        // B. Fixed Deposits (Locked Funds from Ledger)
        Double fd = transactionRepository.getBalanceByHead(networkId, "Fixed Deposit");
        if (fd == null) fd = 0.0;

        // C. Loans (Assets/Receivables from Ledger)
        Double loans = transactionRepository.getOutstandingLoans(networkId);
        if (loans == null) loans = 0.0;

        // D. Network Equity (Cash/Earnings/Expense Difference)
        Double networkBalance = transactionRepository.getNetworkBalance(networkId);
        if (networkBalance == null) networkBalance = 0.0;

        // --- 3. AGGREGATES ---

        // Total Deposits = Liquid Savings + Fixed Deposits
        Double totalDeposits = savings + fd;

        // Reserve (Liquidity Available)
        // Formula: (Money from Users) - (Money Lent Out) + (Own Cash)
        Double reserve = totalDeposits - loans + networkBalance;

        // Total Pool (Total Assets Managed)
        // Formula: Total Deposits + Own Equity
        Double totalPool = totalDeposits + networkBalance;

        // --- 4. TODAY'S SUMMARY (For AdminDashboard.jsx) ---
        LocalDate today = LocalDate.now();

        // Filter Transactions for Today
        List<Transaction> todayTxns = transactions.stream()
            .filter(t -> t.getDate() != null && t.getDate().equals(today))
            .collect(Collectors.toList());

        long todayTxCount = todayTxns.size();
        
        // Sum absolute amount of today's transactions
        double todayTotalAmount = todayTxns.stream()
            .mapToDouble(t -> t.getAmount() != null ? t.getAmount() : 0.0)
            .sum();

        // Count New Users for Today
        // Checks if user.createdAt matches today
        long todayNewUsers = users.stream()
            .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().toLocalDate().equals(today))
            .count();

        Map<String, Object> todaysSummary = new HashMap<>();
        todaysSummary.put("newUsers", todayNewUsers);
        todaysSummary.put("txCount", todayTxCount);
        todaysSummary.put("totalAmount", todayTotalAmount);

        // --- BUILD RESPONSE ---
        Map<String, Object> stats = new HashMap<>();
        stats.put("users", userCount);
        stats.put("transactions", txCount);
        stats.put("totalPool", totalPool);
        stats.put("savings", savings);
        stats.put("fixedDeposit", fd);
        stats.put("totalDeposits", totalDeposits);
        stats.put("credit", loans);
        stats.put("reserve", reserve);
        stats.put("todaysSummary", todaysSummary); // Injecting the dynamic daily stats

        return ResponseEntity.ok(stats);
    }   
}