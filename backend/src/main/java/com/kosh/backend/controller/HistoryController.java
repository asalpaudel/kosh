package com.kosh.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosh.backend.model.ActivityLog;
import com.kosh.backend.repository.ActivityLogRepository;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/history")
public class HistoryController {

    @Autowired
    private ActivityLogRepository logRepo;

    // Get logs for SUPERADMIN (All logs or just system level)
    @GetMapping("/superadmin")
    public ResponseEntity<?> getSuperAdminHistory(HttpSession session) {
        String role = (String) session.getAttribute("userRole");
        if (!"superadmin".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
        }

        // Return all logs, latest first
        List<ActivityLog> logs = logRepo.findAllByOrderByTimestampDesc();
        return ResponseEntity.ok(logs);
    }

    // Get logs for ADMIN (Only their network)
    @GetMapping("/admin")
    public ResponseEntity<?> getAdminHistory(HttpSession session) {
        String role = (String) session.getAttribute("userRole");
        Long sahakariId = (Long) session.getAttribute("sahakariId");

        if (!"admin".equals(role) || sahakariId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
        }

        // Return logs for this sahakari
        List<ActivityLog> logs = logRepo.findBySahakariIdOrderByTimestampDesc(sahakariId);
        return ResponseEntity.ok(logs);
    }
}