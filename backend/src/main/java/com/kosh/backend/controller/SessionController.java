package com.kosh.backend.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;

@RestController
public class SessionController {

    @GetMapping("/api/session")
    public Map<String, Object> getSession(HttpSession session) {
        System.out.println("Session ID: " + session.getId());
        
        Map<String, Object> sessionData = new HashMap<>();
        
        // Get user email (for both admin and user)
        String userEmail = (String) session.getAttribute("userEmail");
        sessionData.put("userEmail", userEmail);
        
        // Get sahakariId from session
        Object sahakariIdObj = session.getAttribute("sahakariId");
        Long sahakariId;

        if (sahakariIdObj == null) {
            sahakariId = null; // Don't set default for users
            System.out.println("No sahakariId in session");
        } else if (sahakariIdObj instanceof Integer) {
            sahakariId = ((Integer) sahakariIdObj).longValue();
        } else {
            sahakariId = (Long) sahakariIdObj;
        }

        sessionData.put("sahakariId", sahakariId);
        
        // Optionally add user role if you stored it in session
        String userRole = (String) session.getAttribute("userRole");
        sessionData.put("userRole", userRole);
        
        System.out.println("Session sahakariId: " + sahakariId);
        System.out.println("Session userEmail: " + userEmail);
        System.out.println("Session userRole: " + userRole);
        
        return sessionData;
    }
}