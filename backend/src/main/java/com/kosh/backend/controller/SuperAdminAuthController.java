package com.kosh.backend.controller;

import java.time.LocalDateTime;

import com.kosh.backend.service.OneTimeCode;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosh.backend.model.ActivityLog;
import com.kosh.backend.repository.ActivityLogRepository;
import com.kosh.backend.service.EmailService;
import com.kosh.backend.service.LoginThrottleService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/superadmin-auth")
public class SuperAdminAuthController {

    @Value("${app.superadmin.email:}")
    private String authorizedEmail;

    /**
     * BCrypt hash of the superadmin password. Empty means no superadmin can sign in: an
     * unconfigured deployment must not fall back to email-only access.
     */
    @Value("${app.superadmin.password-hash:}")
    private String authorizedPasswordHash;

    /**
     * Second factor on top of the password. Off by default; turn it on to mail a one-time
     * code before the session is established.
     */
    @Value("${app.superadmin.otp-enabled:false}")
    private boolean otpEnabled;

    // OTP Storage: email -> SuperAdminOtp
    private static class SuperAdminOtp {
        String otpVerifier;
        LocalDateTime expiry;

        SuperAdminOtp(String otpVerifier, LocalDateTime expiry) {
            this.otpVerifier = otpVerifier;
            this.expiry = expiry;
        }
    }
    
    private final Map<String, SuperAdminOtp> otpStorage = new ConcurrentHashMap<>();
    private final EmailService emailService;
    private final ActivityLogRepository logRepo;
    private final PasswordEncoder passwordEncoder;
    private final LoginThrottleService throttle;

    public SuperAdminAuthController(EmailService emailService, ActivityLogRepository logRepo,
            PasswordEncoder passwordEncoder, LoginThrottleService throttle) {
        this.emailService = emailService;
        this.logRepo = logRepo;
        this.passwordEncoder = passwordEncoder;
        this.throttle = throttle;
    }

    /**
     * Step 1: Validate email and send OTP
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody Map<String, String> payload,
            HttpServletRequest request,
            HttpSession session) {
        String email = payload.get("email");
        String password = payload.get("password");

        if (email == null || email.trim().isEmpty() || password == null || password.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Email and password are required"
            ));
        }


        email = email.trim().toLowerCase();

        // A deployment without a configured superadmin credential has no superadmin.
        if (authorizedEmail.isBlank() || authorizedPasswordHash.isBlank()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "success", false,
                "message", "Superadmin access is not configured"
            ));
        }

        String throttleKey = "superadmin-login:" + email;
        if (throttle.isBlocked(throttleKey)) {
            return tooManyAttempts();
        }

        // One message for a wrong email and a wrong password, so the response cannot be
        // used to confirm which address is the superadmin.
        if (!authorizedEmail.equalsIgnoreCase(email)
                || !passwordEncoder.matches(password, authorizedPasswordHash)) {
            throttle.recordFailure(throttleKey);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "success", false,
                "message", "Invalid credentials"
            ));
        }

        throttle.clear(throttleKey);

        if (!otpEnabled) {
            establishSession(email, request, session);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "status", "LOGIN_SUCCESS",
                    "message", "Login successful",
                    "role", "superadmin"));
        }
        
        
        String otp = OneTimeCode.generate();
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(5);
        
        // Store OTP
        otpStorage.put(email, new SuperAdminOtp(passwordEncoder.encode(otp), expiry));
        session.setAttribute("pendingSuperadminEmail", email);
        
        
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
    public ResponseEntity<?> verifyOtp(
            @RequestBody Map<String, String> payload,
            HttpServletRequest request,
            HttpSession session) {
        String email = payload.get("email");
        String otp = payload.get("otp");
        
        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Email and OTP are required"
            ));
        }
        
        email = email.trim().toLowerCase();
        
        
        Object pendingEmail = session.getAttribute("pendingSuperadminEmail");
        if (!(pendingEmail instanceof String challengeEmail)
                || !challengeEmail.equalsIgnoreCase(email)
                || !authorizedEmail.equalsIgnoreCase(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "success", false,
                "message", "Login challenge is missing or expired"
            ));
        }
        
        
        String throttleKey = "superadmin-otp:" + email;
        if (throttle.isBlocked(throttleKey)) {
            return tooManyAttempts();
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
        
        // A wrong code burns the stored one. Superadmin access rests on this single factor,
        // so a code that survives a failed guess is a code that can be walked.
        if (!passwordEncoder.matches(otp, storedOtp.otpVerifier)) {
            otpStorage.remove(email);
            throttle.recordFailure(throttleKey);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Invalid verification code"
            ));
        }
        
        
        otpStorage.remove(email);
        session.removeAttribute("pendingSuperadminEmail");
        throttle.clear(throttleKey);


        establishSession(email, request, session);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Login successful",
            "role", "superadmin"
        ));
    }

    private static ResponseEntity<?> tooManyAttempts() {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
            "success", false,
            "message", AuthController.TOO_MANY_ATTEMPTS
        ));
    }

    private void establishSession(String email, HttpServletRequest request, HttpSession session) {
        request.changeSessionId();
        session.removeAttribute("pendingSuperadminEmail");
        session.setAttribute("superadminEmail", email);
        session.setAttribute("superadminRole", "superadmin");
        session.setAttribute("superadminLoggedIn", true);
        session.setAttribute("userRole", "superadmin");
        session.setAttribute("userName", "Super Admin");
        session.setAttribute("userEmail", email);

        try {
            logRepo.save(new ActivityLog(
                    "Super Admin", "superadmin", null, "LOGIN", "SuperAdmin logged in successfully."));
        } catch (Exception e) {}
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

        session.invalidate();
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Logged out successfully"
        ));
    }
}
