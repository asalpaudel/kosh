package com.kosh.backend.controller;

import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.util.SessionUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;

import java.util.*;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173" }, allowCredentials = "true")
public class AnalyticsController {

    private final NetworkRepository networkRepository;

    public AnalyticsController(NetworkRepository networkRepository) {
        this.networkRepository = networkRepository;
    }

    @GetMapping("/monthly-revenue")
    public ResponseEntity<?> getMonthlyRevenue(HttpSession session) {
        // Only superadmin can view analytics
        if (!SessionUtil.isSuperadmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only superadmin can view analytics"));
        }

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

        return ResponseEntity.ok(response);
    }

    @GetMapping("/total-revenue")
    public ResponseEntity<?> getTotalRevenue(HttpSession session) {
        // Only superadmin can view analytics
        if (!SessionUtil.isSuperadmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only superadmin can view analytics"));
        }

        List<Object[]> result = networkRepository.getTotalRevenueByType();
        Map<String, Double> totals = new HashMap<>();
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
        
        return ResponseEntity.ok(totals);
    }
}