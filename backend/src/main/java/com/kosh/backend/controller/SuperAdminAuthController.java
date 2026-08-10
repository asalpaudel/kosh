package com.kosh.backend.controller;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosh.backend.model.ActivityLog;
import com.kosh.backend.repository.ActivityLogRepository;
import com.kosh.backend.service.EmailService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/superadmin-auth")
public class SuperAdminAuthController {

    @Value("${app.superadmin.email:}")
    private String authorizedEmail;
    
    // OTP Storage: email -> SuperAdminOtp
    private static class SuperAdminOtp {
        String otp;
        LocalDateTime expiry;
        
        SuperAdminOtp(String otp, LocalDateTime expiry) {
            this.otp = otp;
            this.expiry = expiry;
        }
    }
    
    private final Map<String, SuperAdminOtp> otpStorage = new ConcurrentHashMap<>();
    private final EmailService emailService;
    private final ActivityLogRepository logRepo;

    public SuperAdminAuthController(EmailService emailService, ActivityLogRepository logRepo) {
        this.emailService = emailService;
        this.logRepo = logRepo;
    }

    /**
     * Step 1: Validate email and send OTP
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload, HttpSession session) {
        String email = payload.get("email");
        
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Email is required"
            ));
        }
        

        email = email.trim().toLowerCase();
        
        // validation
        if (!authorizedEmail.equalsIgnoreCase(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "success", false,
                "message", "Unauthorized email address"
            ));
        }
        
        
        String otp = String.format("%06d", new Random().nextInt(999999));
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(5);
        
        // Store OTP
        otpStorage.put(email, new SuperAdminOtp(otp, expiry));
        
        
        try {
            String subject = "🔐 Superadmin Login Verification";
            String body = "Your superadmin login verification code is: " + otp + "\n\n" +
                          "This code expires in 5 minutes.\n\n" +
                          "If you did not request this, please secure your account immediately.";
            emailService.sendEmail(email, subject, body);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "status", "OTP_SENT",
                "message", "Verification code sent to your email"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Failed to send verification email"
            ));
        }
    }


    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload, HttpSession session) {
        String email = payload.get("email");
        String otp = payload.get("otp");
        
        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Email and OTP are required"
            ));
        }
        
        email = email.trim().toLowerCase();
        
        
        if (!authorizedEmail.equalsIgnoreCase(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "success", false,
                "message", "Unauthorized email address"
            ));
        }
        
        
        SuperAdminOtp storedOtp = otpStorage.get(email);
        
        if (storedOtp == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "No OTP found. Please request a new code."
            ));
        }
        
        if (storedOtp.expiry.isBefore(LocalDateTime.now())) {
            otpStorage.remove(email);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "OTP has expired. Please request a new code."
            ));
        }
        
        if (!storedOtp.otp.equals(otp)) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Invalid verification code"
            ));
        }
        
        
        otpStorage.remove(email);
        
        
        session.setAttribute("superadminEmail", email);
        session.setAttribute("superadminRole", "superadmin");
        session.setAttribute("superadminLoggedIn", true);
        
        // ⭐ UNIFY SESSION KEYS FOR OTHER CONTROLLERS
        session.setAttribute("userRole", "superadmin");
        session.setAttribute("userName", "Super Admin");
        session.setAttribute("userEmail", email);

        // Log Login
        try {
            ActivityLog log = new ActivityLog("Super Admin", "superadmin", null, "LOGIN", "SuperAdmin logged in via OTP.");
            logRepo.save(log);
        } catch (Exception e) {}
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Login successful",
            "role", "superadmin"
        ));
    }

    /**
     
     */
    @GetMapping("/session")
    public ResponseEntity<?> checkSession(HttpSession session) {
        Boolean isLoggedIn = (Boolean) session.getAttribute("superadminLoggedIn");
        String role = (String) session.getAttribute("superadminRole");
        
        if (isLoggedIn != null && isLoggedIn && "superadmin".equals(role)) {
            return ResponseEntity.ok(Map.of(
                "authenticated", true,
                "role", "superadmin",
                "email", session.getAttribute("superadminEmail")
            ));
        }
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
            "authenticated", false,
            "message", "Not authenticated as superadmin"
        ));
    }

    /**
     
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        // Log Logout
        try {
            String role = (String) session.getAttribute("userRole");
            String name = (String) session.getAttribute("userName");
            if ("superadmin".equals(role)) {
                ActivityLog log = new ActivityLog(name != null ? name : "Super Admin", "superadmin", null, "LOGOUT", "SuperAdmin logged out.");
                logRepo.save(log);
            }
        } catch (Exception e) {}

        session.removeAttribute("superadminEmail");
        session.removeAttribute("superadminRole");
        session.removeAttribute("superadminLoggedIn");
        session.removeAttribute("userRole");
        session.removeAttribute("userName");
        session.removeAttribute("userEmail");
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Logged out successfully"
        ));
    }
}
