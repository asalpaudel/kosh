package com.kosh.backend.controller;

import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
//@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true") // Changed to 5173
public class SessionController {

    @GetMapping("/api/session")
    public Map<String, Long> getSession(HttpSession session) {
        System.out.println("Session ID: " + session.getId());
        System.out.println("Session sahakariId: " + session.getAttribute("sahakariId"));

        // Get sahakariId from session
        Object sahakariIdObj = session.getAttribute("sahakariId");
        Long sahakariId;

        if (sahakariIdObj == null) {
            // If no session attribute exists, set default as Long
            sahakariId = 6L;
            session.setAttribute("sahakariId", sahakariId);
            System.out.println("No sahakariId in session, set default: 6");
        } else if (sahakariIdObj instanceof Integer) {
            sahakariId = ((Integer) sahakariIdObj).longValue();
        } else {
            sahakariId = (Long) sahakariIdObj;
        }

        return Map.of("sahakariId", sahakariId);
    }
}