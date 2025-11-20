package com.kosh.backend.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosh.backend.model.Network;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.repository.UserRepository;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository repo;
    private final NetworkRepository networkRepo;

    public AuthController(UserRepository repo, NetworkRepository networkRepo) {
        this.repo = repo;
        this.networkRepo = networkRepo;
    }

    public static class LoginRequest {
        public String email;
        public String password;
    }

    public static class LoginResponse {
        public boolean success;
        public String message;
        public String role;
        public int userId;
        public Long networkId;
        public String status;

        public LoginResponse(boolean success, String message, String role, int userId, Long networkId) {
            this.success = success;
            this.message = message;
            this.role = role;
            this.userId = userId;
            this.networkId = networkId;
        }

        public LoginResponse(boolean success, String message, String role, int userId, Long networkId, String status) {
            this.success = success;
            this.message = message;
            this.role = role;
            this.userId = userId;
            this.networkId = networkId;
            this.status = status;
        }
    }

   @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest req, HttpSession session) {

        User user = repo.findByEmail(req.email);

        if (user == null) {
            return new LoginResponse(false, "Email not found", null, -1, null);
        }

        if (!user.getPassword().equals(req.password)) {
            return new LoginResponse(false, "Incorrect password", null, -1, null);
        }

        System.out.println("DEBUG: User status is: " + user.getStatus());
        
        if (user.getStatus() == null || !user.getStatus().equals("Active")) {
            String message;
            if ("Pending".equals(user.getStatus())) {
                message = "Your account is pending approval. Please wait for admin approval.";
            } else if ("Rejected".equals(user.getStatus())) {
                message = "Your account has been rejected. Please contact support.";
            } else {
                message = "Your account is not active. Status: " + user.getStatus();
            }
            
            System.out.println("LOGIN BLOCKED - User status: " + user.getStatus());
            return new LoginResponse(false, message, null, -1, null, user.getStatus());
        }
        
        System.out.println("User status is Active - allowing login");

        Long networkId = null;

        if (!user.getRole().equals("superadmin")) {
            Network net = networkRepo.findByName(user.getSahakari());
            if (net != null) {
                networkId = net.getId();
            }
        }

        session.setAttribute("userEmail", user.getEmail());
        session.setAttribute("sahakariId", networkId);
        session.setAttribute("userId", user.getId());
        session.setAttribute("userRole", user.getRole());
        session.setAttribute("userName", user.getName()); 

        System.out.println("User logged in: " + user.getEmail());
        System.out.println("Session ID: " + session.getId());

        return new LoginResponse(
                true,
                "Login successful",
                user.getRole(),
                user.getId().intValue(),
                networkId);
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpSession session) {
        session.invalidate();
        System.out.println("User logged out, session invalidated");
        
        Map<String, String> response = new HashMap<>();
        response.put("success", "true");
        response.put("message", "Logged out successfully");
        return response;
    }
}