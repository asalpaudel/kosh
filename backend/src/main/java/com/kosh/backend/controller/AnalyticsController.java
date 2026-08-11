package com.kosh.backend.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosh.backend.model.Transaction;
import com.kosh.backend.ledger.Accounts;
import com.kosh.backend.ledger.LedgerReports;
import com.kosh.backend.service.Money;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.repository.TransactionRepository;
import com.kosh.backend.repository.UserRepository;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final NetworkRepository networkRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final LedgerReports ledgerReports;

    public AnalyticsController(NetworkRepository networkRepository, 
                               TransactionRepository transactionRepository, 
                               UserRepository userRepository,
                               LedgerReports ledgerReports) {
        this.networkRepository = networkRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.ledgerReports = ledgerReports;
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

    /** Platform-wide counts using the only cooperative roles permitted by the schema. */
    @GetMapping("/network-snapshot")
    public Map<String, Long> getNetworkSnapshot() {
        Map<String, Long> snapshot = new HashMap<>();
        snapshot.put("networks", networkRepository.count());
        snapshot.put("admins", userRepository.countByRoleIgnoreCase("admin"));
        snapshot.put("members", userRepository.countByRoleIgnoreCase("member"));
        return snapshot;
    }

    // Total revenue by type (for percentages)
    @GetMapping("/total-revenue")
    public Map<String, BigDecimal> getTotalRevenue() {
        List<Object[]> result = networkRepository.getTotalRevenueByType();
        Map<String, BigDecimal> totals = new HashMap<>();
        // Initialize all keys to 0
        totals.put("basic", Money.ZERO);
        totals.put("premium", Money.ZERO);
        totals.put("custom", Money.ZERO);

        for (Object[] row : result) {
            String key = ((String) row[0]).toLowerCase();
            Number value = (Number) row[1];
            if (value != null) {
                totals.put(key, Money.of(value));
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

        // Every figure below is read from the journal, so the dashboard and the statements
        // can never tell different stories about the same money.
        BigDecimal savings = ledgerReports.accountBalance(networkId, Accounts.MEMBER_SAVINGS);
        BigDecimal fd = ledgerReports.accountBalance(networkId, Accounts.FIXED_DEPOSITS);
        BigDecimal loans = ledgerReports.accountBalance(networkId, Accounts.LOANS_RECEIVABLE);

        BigDecimal totalDeposits = savings.add(fd);

        // Reserve is what the cooperative can actually lend: cash plus bank.
        BigDecimal reserve = ledgerReports.liquidity(networkId);

        // Total assets under management: liquid funds plus what is out on loan.
        BigDecimal totalPool = reserve.add(loans);

        // --- 4. TODAY'S SUMMARY (For AdminDashboard.jsx) ---
        LocalDate today = LocalDate.now();

        // Filter Transactions for Today
        List<Transaction> todayTxns = transactions.stream()
            .filter(t -> t.getDate() != null && t.getDate().equals(today))
            .collect(Collectors.toList());

        long todayTxCount = todayTxns.size();
        
        // Sum absolute amount of today's transactions
        BigDecimal todayTotalAmount = todayTxns.stream()
            .map(t -> Money.orZero(t.getAmount()))
            .reduce(Money.ZERO, BigDecimal::add);

        // Count New Users for Today
        // Checks if user.createdAt matches today
        long todayNewUsers = users.stream()
            .filter(u -> u.getCreatedAt() != null && u.getCreatedAt()
                    .atZone(ZoneId.of("Asia/Kathmandu")).toLocalDate().equals(today))
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
