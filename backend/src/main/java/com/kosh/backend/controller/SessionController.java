package com.kosh.backend.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;

@RestController
public class SessionController {

    @Value("${server.servlet.session.timeout:1m}")
    private String sessionTimeout;

    @GetMapping("/api/session")
    public ResponseEntity<Map<String, Object>> getSession(HttpSession session) {
        System.out.println("Session ID: " + session.getId());
        System.out.println("Session Max Inactive Interval: " + session.getMaxInactiveInterval() + " seconds");
        
        Map<String, Object> sessionData = new HashMap<>();
        
        // Get user email
        String userEmail = (String) session.getAttribute("userEmail");
        
        // If no userEmail, session is invalid or expired
        if (userEmail == null) {
            sessionData.put("error", "Session expired or invalid");
            sessionData.put("expired", true);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(sessionData);
        }
        
        sessionData.put("userEmail", userEmail);
        
        // Get sahakariId
        Object sahakariIdObj = session.getAttribute("sahakariId");
        Long sahakariId;

        if (sahakariIdObj == null) {
            sahakariId = null;
        } else if (sahakariIdObj instanceof Integer) {
            sahakariId = ((Integer) sahakariIdObj).longValue();
        } else {
            sahakariId = (Long) sahakariIdObj;
        }

        sessionData.put("sahakariId", sahakariId);
        
        // Get user role
        String userRole = (String) session.getAttribute("userRole");
        sessionData.put("userRole", userRole);
        
        // Add session timeout info
        sessionData.put("maxInactiveInterval", session.getMaxInactiveInterval()); // in seconds
        sessionData.put("expired", false);
        
        System.out.println("Session valid - userEmail: " + userEmail);
        
        return ResponseEntity.ok(sessionData);
    }
}