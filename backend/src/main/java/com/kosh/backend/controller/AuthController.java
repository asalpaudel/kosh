package com.kosh.backend.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173") // Allow frontend (Vite dev server)
public class AuthController {

    // DTO for login request now includes role
    public static class LoginRequest {
        public String email;
        public String password;
        public String role; // "user", "admin", or "superadmin"
    }

    // DTO for response now includes role for redirection
    public static class LoginResponse {
        public boolean success;
        public String message;
        public String role; // The role we validated

        public LoginResponse(boolean success, String message, String role) {
            this.success = success;
            this.message = message;
            this.role = role;
        }
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest req) {
        
        // Hardcoded credentials for all three roles
        // In a real app, you would look this up in a database

        switch (req.role) {
            case "user":
                if ("user@example.com".equals(req.email) && "pass123".equals(req.password)) {
                    return new LoginResponse(true, "Welcome User!", "user");
                }
                break;
            
            case "admin":
                if ("admin@example.com".equals(req.email) && "pass123".equals(req.password)) {
                    return new LoginResponse(true, "Welcome Admin!", "admin");
                }
                break;
            
            case "superadmin":
                if ("superadmin@example.com".equals(req.email) && "pass123".equals(req.password)) {
                    return new LoginResponse(true, "Welcome Superadmin!", "superadmin");
                }
                break;
            
            default:
                // If role is not "user", "admin", or "superadmin"
                return new LoginResponse(false, "Invalid role specified.", null);
        }

        // If we get here, the role was valid but credentials were wrong
        return new LoginResponse(false, "Invalid email or password for that role.", null);
    }
}