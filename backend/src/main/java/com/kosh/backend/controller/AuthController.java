package com.kosh.backend.controller;

import java.time.Instant;

import com.kosh.backend.service.OneTimeCode;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
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
import com.kosh.backend.service.LoginThrottleService;
import com.kosh.backend.service.SecureToken;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository repo;
    private final NetworkRepository networkRepo;
    private final ActivityLogRepository logRepo;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final LoginThrottleService throttle;

    @Value("${server.servlet.session.cookie.secure:false}")
    private boolean secureCookies;

    @Value("${app.auth.two-factor-enabled:true}")
    private boolean twoFactorEnabled;

    public AuthController(UserRepository repo, NetworkRepository networkRepo, ActivityLogRepository logRepo,
            PasswordEncoder passwordEncoder, EmailService emailService, LoginThrottleService throttle) {
        this.repo = repo;
        this.networkRepo = networkRepo;
        this.logRepo = logRepo;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.throttle = throttle;
    }

    static final String TOO_MANY_ATTEMPTS =
            "Too many failed attempts. Try again in " + LoginThrottleService.BLOCK_DURATION.toMinutes() + " minutes.";

    private static ResponseEntity<?> tooManyAttempts() {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of("success", false, "message", TOO_MANY_ATTEMPTS));
    }

    private static final String INVALID_CREDENTIALS = "Invalid email or password";
    private static final String RESET_REQUESTED =
            "If that account exists, a password reset code has been sent";
    private static final String PENDING_2FA_USER_ID = "pending2faUserId";
    private static final String DUMMY_PASSWORD_HASH =
            "$2a$10$7EqJtq98hPqEX7fNZaFWoO5x5y5YI3Q3rQyV7QEqwSEY8VYq3M.4e";

    public static class LoginRequest {
        public String email;
        public String password;
    }

    // Response DTO capable of handling both success/fail and 2FA challenges
    public static class LoginResponse {
        public boolean success;
        public String message;
        public String role;
        public Long userId;
        public Long networkId;
        public String status;
        public String name;
        public String sahakari;

        public LoginResponse(boolean success, String message, String role, Long userId, Long networkId, String status, String name, String sahakari) {
            this.success = success;
            this.message = message;
            this.role = role;
            this.userId = userId;
            this.networkId = networkId;
            this.status = status;
            this.name = name;
            this.sahakari = sahakari;
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req, HttpServletRequest request, HttpSession session) {
        // Accounts are stored with a lowercased email, so the lookup has to match that form.
        String email = normalizeEmail(req.email);
        String throttleKey = "login:" + email;

        if (throttle.isBlocked(throttleKey)) {
            return tooManyAttempts();
        }

        User user = email == null || email.isBlank() ? null : repo.findByEmail(email);

        if (user == null || req.password == null) {
            if (req.password != null) passwordEncoder.matches(req.password, DUMMY_PASSWORD_HASH);
            throttle.recordFailure(throttleKey);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new LoginResponse(false, INVALID_CREDENTIALS, null, -1L, null, null, null, null));
        }

        if (!passwordEncoder.matches(req.password, user.getPassword())) {
            throttle.recordFailure(throttleKey);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new LoginResponse(false, INVALID_CREDENTIALS, null, -1L, null, null, null, null));
        }

        throttle.clear(throttleKey);

        // Check Account Status
        if (user.getStatus() == null || !user.getStatus().equals("Active")) {
            String message = "Your account is not active. Status: " + user.getStatus();
            if ("Pending".equals(user.getStatus())) message = "Your account is pending approval.";
            else if ("Rejected".equals(user.getStatus())) message = "Your account has been rejected.";
            
            return ResponseEntity.ok(new LoginResponse(false, message, null, -1L, null, user.getStatus(), null, null));
        }

        if (!twoFactorEnabled) {
            return performLogin(user, request, session);
        }

        // --- CHECK TRUSTED DEVICE COOKIE ---
        boolean isDeviceTrusted = false;
        Cookie[] cookies = request.getCookies();
        if (cookies != null && user.getTrustedDeviceToken() != null) {
            for (Cookie c : cookies) {
                if ("trusted_device".equals(c.getName())
                        && SecureToken.matches(c.getValue(), user.getTrustedDeviceToken())) {
                    // Check if token is still valid (not expired)
                    if (user.getTrustedDeviceExpiry() != null && user.getTrustedDeviceExpiry().isAfter(Instant.now())) {
                        isDeviceTrusted = true;
                    }
                }
            }
        }

        // Scenario 1: Device is trusted -> Log in directly
        if (isDeviceTrusted) {
            return performLogin(user, request, session);
        } 
        
        // Scenario 2: Unknown Device -> Trigger 2FA
        else {
            String otp = OneTimeCode.generate();
            user.setTwoFactorCode(passwordEncoder.encode(otp));
            user.setTwoFactorExpiry(Instant.now().plus(java.time.Duration.ofMinutes(10)));
            repo.save(user);
            session.setAttribute(PENDING_2FA_USER_ID, user.getId());

            // Send Email
            String subject = "Your Login Verification Code";
            String body = "Hello " + user.getName() + ",\n\n" +
                          "Your verification code is: " + otp + "\n" +
                          "This code expires in 10 minutes.\n\n" +
                          "If you did not request this, please secure your account immediately.";
            emailService.sendEmail(user.getEmail(), subject, body);

            // Return "2FA_REQUIRED" status so frontend knows to switch to Step 2
            return ResponseEntity.ok(Map.of(
                "success", true,
                "status", "2FA_REQUIRED",
                "userId", user.getId(),
                "message", "Verification code sent to email"
            ));
        }
    }

    @PostMapping("/verify-2fa")
    public ResponseEntity<?> verify2FA(@RequestBody Map<String, Object> payload, 
                                       HttpServletResponse response,
                                       HttpServletRequest request,
                                       HttpSession session) {
        
        Object pendingUserId = session.getAttribute(PENDING_2FA_USER_ID);
        if (!(pendingUserId instanceof Long userId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Login challenge is missing or expired"));
        }
        String otp = (String) payload.get("otp");
        boolean trustDevice = Boolean.TRUE.equals(payload.get("trustDevice"));

        String twoFactorKey = "2fa:" + userId;
        if (throttle.isBlocked(twoFactorKey)) {
            return tooManyAttempts();
        }

        User user = repo.findById(userId).orElse(null);

        if (user == null) {
            throttle.recordFailure(twoFactorKey);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "User not found"));
        }

        // Validate OTP. A wrong or expired code burns the stored one: without that, the
        // six-digit space can be walked in a few thousand requests before it expires.
        boolean valid = user.getTwoFactorCode() != null
                && user.getTwoFactorExpiry() != null
                && user.getTwoFactorExpiry().isAfter(Instant.now())
                && otp != null
                && passwordEncoder.matches(otp, user.getTwoFactorCode());

        if (!valid) {
            throttle.recordFailure(twoFactorKey);
            if (user.getTwoFactorCode() != null) {
                user.setTwoFactorCode(null);
                user.setTwoFactorExpiry(null);
                repo.save(user);
            }
            return ResponseEntity.ok(Map.of("success", false, "message", "Invalid or expired code"));
        }

        // Clear OTP (Success)
        throttle.clear(twoFactorKey);
        user.setTwoFactorCode(null);
        user.setTwoFactorExpiry(null);
        session.removeAttribute(PENDING_2FA_USER_ID);

        // Handle "Trust This Device" Logic
        if (trustDevice) {
            String token = SecureToken.generate();
            user.setTrustedDeviceToken(SecureToken.verifier(token));
            user.setTrustedDeviceExpiry(Instant.now().plus(java.time.Duration.ofDays(30))); // 30 Days Validity
            
            // Set Cookie
            ResponseCookie cookie = ResponseCookie.from("trusted_device", token)
                    .maxAge(30 * 24 * 60 * 60)
                    .path("/")
                    .httpOnly(true)
                    .secure(secureCookies)
                    .sameSite("Lax")
                    .build();
            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        }

        repo.save(user);
        return performLogin(user, request, session);
    }

    // Helper method to finalize the session
    private ResponseEntity<?> performLogin(User user, HttpServletRequest request, HttpSession session) {
        Long networkId = "superadmin".equals(user.getRole()) ? null : user.getSahakariId();
        if (!"superadmin".equals(user.getRole()) && networkId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Account has no cooperative assignment"));
        }

        request.changeSessionId();
        session.removeAttribute(PENDING_2FA_USER_ID);
        session.setAttribute("userEmail", user.getEmail());
        session.setAttribute("userId", user.getId());
        session.setAttribute("sahakariId", networkId);
        session.setAttribute("sahakari", user.getSahakari()); 
        session.setAttribute("userRole", user.getRole());
        session.setAttribute("userName", user.getName());

        // Log Activity
        if ("admin".equals(user.getRole()) || "superadmin".equals(user.getRole())) {
            try {
                ActivityLog log = new ActivityLog(user.getName(), user.getRole(), networkId, "LOGIN", "Logged in successfully.");
                logRepo.save(log);
            } catch (Exception e) {}
        }

        return ResponseEntity.ok(new LoginResponse(
            true, "Login successful", user.getRole(), 
            user.getId(), networkId,
            user.getStatus(), user.getName(), user.getSahakari()
        ));
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpSession session, HttpServletResponse response) {
        try {
            String userRole = (String) session.getAttribute("userRole");
            if (userRole != null && ("admin".equals(userRole) || "superadmin".equals(userRole))) {
                ActivityLog log = new ActivityLog(
                    (String) session.getAttribute("userName"), 
                    userRole, 
                    (Long) session.getAttribute("sahakariId"), 
                    "LOGOUT", 
                    userRole + " logged out."
                );
                logRepo.save(log);
            }
        } catch (Exception e) {}

        Object userId = session.getAttribute("userId");
        if (userId instanceof Long id) {
            repo.findById(id).ifPresent(user -> {
                user.setTrustedDeviceToken(null);
                user.setTrustedDeviceExpiry(null);
                repo.save(user);
            });
        }
        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from("trusted_device", "")
                .maxAge(0).path("/").httpOnly(true).secure(secureCookies).sameSite("Lax").build().toString());
        session.invalidate();
        return Map.of("success", "true", "message", "Logged out successfully");
    }

    @PostMapping("/forgot-password")
    public Map<String, Object> forgotPassword(@RequestBody Map<String, String> payload) {
        String email = normalizeEmail(payload.get("email"));
        if (email == null || email.isBlank()) {
            return Map.of("success", true, "message", RESET_REQUESTED);
        }
        String throttleKey = "forgot:" + email;
        if (throttle.isBlocked(throttleKey)) {
            return Map.of("success", true, "message", RESET_REQUESTED);
        }
        throttle.recordFailure(throttleKey);
        User user = repo.findByEmail(email);

        if (user == null) return Map.of("success", true, "message", RESET_REQUESTED);

        Network network = (user.getSahakariId() != null) ? networkRepo.findById(user.getSahakariId()).orElse(null) : null;

        try {
            String otp = emailService.generateOtp(email);
            emailService.sendOtpEmail(email, user.getName(), otp, network);
            return Map.of("success", true, "message", RESET_REQUESTED);
        } catch (Exception e) {
            emailService.clearOtp(email);
            return Map.of("success", true, "message", RESET_REQUESTED);
        }
    }

    @PostMapping("/reset-password")
    public Map<String, Object> resetPassword(@RequestBody Map<String, String> payload) {
        String email = normalizeEmail(payload.get("email"));
        String otp = payload.get("otp");
        String newPassword = payload.get("newPassword");
        String throttleKey = "reset:" + email;

        if (email == null || email.isBlank() || otp == null) {
            return Map.of("success", false, "message", "Invalid or expired OTP");
        }

        if (throttle.isBlocked(throttleKey)) {
            return Map.of("success", false, "message", TOO_MANY_ATTEMPTS);
        }

        if (newPassword == null || newPassword.length() < 8) {
            return Map.of("success", false, "message", "Password must be at least 8 characters");
        }

        if (!emailService.validateOtp(email, otp)) {
            throttle.recordFailure(throttleKey);
            return Map.of("success", false, "message", "Invalid or expired OTP");
        }

        User user = repo.findByEmail(email);
        if (user != null) {
            throttle.clear(throttleKey);
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setTrustedDeviceToken(null);
            user.setTrustedDeviceExpiry(null);
            repo.save(user);
            emailService.clearOtp(email);
            return Map.of("success", true, "message", "Password changed successfully");
        }
        return Map.of("success", false, "message", "User not found");
    }
}
