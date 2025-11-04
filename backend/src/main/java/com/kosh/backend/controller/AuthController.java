package com.kosh.backend.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173") // Allow frontend (Vite dev server)
public class AuthController {

    // Simple DTO for login request
    public static class LoginRequest {
        public String email;
        public String password;
    }

    // Simple DTO for response
    public static class LoginResponse {
        public boolean success;
        public String message;

        public LoginResponse(boolean success, String message) {
            this.success = success;
            this.message = message;
        }
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest req) {
        // Hardcoded credentials
        String validEmail = "admin@example.com";
        String validPassword = "12345";

        if (validEmail.equals(req.email) && validPassword.equals(req.password)) {
            return new LoginResponse(true, "Welcome Admin!");
        } else {
            return new LoginResponse(false, "Invalid email or password.");
        }
    }
}
