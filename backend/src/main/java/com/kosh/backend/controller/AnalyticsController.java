package com.kosh.backend.controller;

import com.kosh.backend.repository.NetworkRepository;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173" }, allowCredentials = "true")
public class AnalyticsController {

    private final NetworkRepository networkRepository;

    public AnalyticsController(NetworkRepository networkRepository) {
        this.networkRepository = networkRepository;
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

}