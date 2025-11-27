package com.kosh.backend.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosh.backend.model.Network;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.repository.UserRepository;

import jakarta.servlet.http.HttpSession;

@RestController
public class SessionController {

    @Value("${server.servlet.session.timeout:1m}")
    private String sessionTimeout;

    private final UserRepository userRepo;
    private final NetworkRepository networkRepo;

    public SessionController(UserRepository userRepo, NetworkRepository networkRepo) {
        this.userRepo = userRepo;
        this.networkRepo = networkRepo;
    }

    @GetMapping("/api/session")
    public ResponseEntity<Map<String, Object>> getSession(HttpSession session) {

        Map<String, Object> sessionData = new HashMap<>();

        // -------------------------------------------------------------
        // 1) BASIC USER VALIDATION 
        // -------------------------------------------------------------
        String userEmail = (String) session.getAttribute("userEmail");

        if (userEmail == null) {
            sessionData.put("expired", true);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(sessionData);
        }

        sessionData.put("userEmail", userEmail);
        sessionData.put("userName", session.getAttribute("userName"));
        sessionData.put("userRole", session.getAttribute("userRole"));
        sessionData.put("userId", session.getAttribute("userId"));

        // -------------------------------------------------------------
        // 2) SAHAKARI ID 
        // -------------------------------------------------------------
        Object sahakariIdObj = session.getAttribute("sahakariId");
        Long sahakariId = null;

        if (sahakariIdObj instanceof Integer) sahakariId = ((Integer) sahakariIdObj).longValue();
        else if (sahakariIdObj instanceof Long) sahakariId = (Long) sahakariIdObj;

        // If still missing — fetch user
        if (sahakariId == null) {
            User user = userRepo.findByEmail(userEmail);
            if (user != null && user.getSahakariId() != null) {
                sahakariId = user.getSahakariId();
                session.setAttribute("sahakariId", sahakariId);
            }
        }

        sessionData.put("sahakariId", sahakariId);

        // -------------------------------------------------------------
        // 3) SAHAKARI NAME
        // -------------------------------------------------------------
        String sahakari = (String) session.getAttribute("sahakari");

        if (sahakari == null) {
            User user = userRepo.findByEmail(userEmail);
            if (user != null) {
                sahakari = user.getSahakari();
                session.setAttribute("sahakari", sahakari);
            }
        }

        sessionData.put("sahakari", sahakari);

        // -------------------------------------------------------------
        // 4) NETWORK INFO 
        // -------------------------------------------------------------
        if (sahakariId != null) {
            Network net = networkRepo.findById(sahakariId).orElse(null);

            if (net != null) {
                sessionData.put("networkName", net.getName());
                sessionData.put("networkPan", net.getPanNumber());
                sessionData.put("networkAddress", net.getAddress());
                sessionData.put("hasLogo", net.getLogoData() != null);
            } else {
                sessionData.put("networkName", sahakari);
                sessionData.put("networkPan", null);
                sessionData.put("networkAddress", null);
                sessionData.put("hasLogo", false);
            }
        }

        // -------------------------------------------------------------
        // 5) META
        // -------------------------------------------------------------
        sessionData.put("expired", false);
        sessionData.put("maxInactiveInterval", session.getMaxInactiveInterval());

        return ResponseEntity.ok(sessionData);
    }
}
