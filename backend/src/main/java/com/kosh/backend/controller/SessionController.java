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
        
        Map<String, Object> sessionData = new HashMap<>();
        
        String userEmail = (String) session.getAttribute("userEmail");
        
        if (userEmail == null) {
            sessionData.put("error", "Session expired or invalid");
            sessionData.put("expired", true);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(sessionData);
        }
        
        sessionData.put("userEmail", userEmail);
        
        String userName = (String) session.getAttribute("userName");
        sessionData.put("userName", userName);

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
        
        String userRole = (String) session.getAttribute("userRole");
        sessionData.put("userRole", userRole);
        
        sessionData.put("maxInactiveInterval", session.getMaxInactiveInterval());
        sessionData.put("expired", false);
        
        return ResponseEntity.ok(sessionData);
    }
}