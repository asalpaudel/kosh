package com.kosh.backend.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosh.backend.model.ActivityLog;
import com.kosh.backend.model.Network;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.ActivityLogRepository;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.repository.UserRepository;
import com.kosh.backend.service.EmailService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository repo;
    private final NetworkRepository networkRepo;
    private final ActivityLogRepository logRepo;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public AuthController(UserRepository repo, NetworkRepository networkRepo, ActivityLogRepository logRepo, PasswordEncoder passwordEncoder, EmailService emailService) {
        this.repo = repo;
        this.networkRepo = networkRepo;
        this.logRepo = logRepo;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
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

        if (!passwordEncoder.matches(req.password, user.getPassword())) {
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
        String sahakariName = null;

        if (!user.getRole().equals("superadmin")) {
            sahakariName = user.getSahakari(); 
            Network net = networkRepo.findByName(sahakariName);
            if (net != null) {
                networkId = net.getId();
            }
        }

        session.setAttribute("userEmail", user.getEmail());
        session.setAttribute("userId", user.getId());
        session.setAttribute("sahakariId", networkId);
        session.setAttribute("sahakari", sahakariName); 
        session.setAttribute("userId", user.getId());
        session.setAttribute("userRole", user.getRole());
        session.setAttribute("userName", user.getName());

        System.out.println("========== LOGIN SESSION DEBUG ==========");
        System.out.println("User logged in: " + user.getEmail());
        System.out.println("Session ID: " + session.getId());
        System.out.println("Session sahakari: " + session.getAttribute("sahakari"));
        System.out.println("Session sahakariId: " + session.getAttribute("sahakariId"));
        System.out.println("=========================================");

        if ("admin".equals(user.getRole()) || "superadmin".equals(user.getRole())) {
            try {
                ActivityLog log = new ActivityLog(
                    user.getName(), 
                    user.getRole(), 
                    networkId, 
                    "LOGIN", 
                    user.getRole() + " logged in successfully."
                );
                logRepo.save(log);
            } catch (Exception e) {
                System.out.println("Failed to save login activity log: " + e.getMessage());
            }
        }

        return new LoginResponse(
                true,
                "Login successful",
                user.getRole(),
                user.getId().intValue(),
                networkId);
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpSession session) {
        
        try {
            String userRole = (String) session.getAttribute("userRole");
            if (userRole != null && ("admin".equals(userRole) || "superadmin".equals(userRole))) {
                Object sahakariIdObj = session.getAttribute("sahakariId");
                Long sahakariId = null;
                if (sahakariIdObj instanceof Long) sahakariId = (Long) sahakariIdObj;
                else if (sahakariIdObj instanceof Integer) sahakariId = ((Integer) sahakariIdObj).longValue();
                
                String userName = (String) session.getAttribute("userName");
                if (userName == null) userName = "Unknown User";
                
                ActivityLog log = new ActivityLog(
                    userName, 
                    userRole, 
                    sahakariId, 
                    "LOGOUT", 
                    userRole + " logged out."
                );
                logRepo.save(log);
            }
        } catch (Exception e) {
            System.out.println("Failed to save logout activity log: " + e.getMessage());
        }

        session.invalidate();
        System.out.println("User logged out, session invalidated");
        
        Map<String, String> response = new HashMap<>();
        response.put("success", "true");
        response.put("message", "Logged out successfully");
        return response;
    }

    @PostMapping("/forgot-password")
    public Map<String, Object> forgotPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        User user = repo.findByEmail(email);

        if (user == null) {
            return Map.of("success", false, "message", "Email not found");
        }

        Network network = null;
        if (user.getSahakariId() != null) {
            network = networkRepo.findById(user.getSahakariId()).orElse(null);
        }

        try {
            String otp = emailService.generateOtp(email);
            emailService.sendOtpEmail(email, user.getName(), otp, network);
            return Map.of("success", true, "message", "OTP sent to your email");
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("success", false, "message", "Failed to send email");
        }
    }

    @PostMapping("/reset-password")
    public Map<String, Object> resetPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");
        String newPassword = payload.get("newPassword");

        if (!emailService.validateOtp(email, otp)) {
            return Map.of("success", false, "message", "Invalid or expired OTP");
        }

        User user = repo.findByEmail(email);
        if (user != null) {
            user.setPassword(passwordEncoder.encode(newPassword));
            repo.save(user);
            emailService.clearOtp(email); 
            
            return Map.of("success", true, "message", "Password changed successfully");
        }

        return Map.of("success", false, "message", "User not found");
    }
}