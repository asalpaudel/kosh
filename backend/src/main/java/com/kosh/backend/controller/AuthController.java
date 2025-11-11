package com.kosh.backend.controller;

import org.springframework.web.bind.annotation.*;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.UserRepository;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final UserRepository repo;

    public AuthController(UserRepository repo) {
        this.repo = repo;
    }

    // Request DTO
    public static class LoginRequest {
        public String email;
        public String password;
    }

    // Response DTO
    public static class LoginResponse {
        public boolean success;
        public String message;
        public String role;
        public int userId;

        public LoginResponse(boolean success, String message, String role, int userId) {
            this.success = success;
            this.message = message;
            this.role = role;
            this.userId = userId;
        }
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest req) {

        System.out.println("============= LOGIN REQUEST =============");
        System.out.println("EMAIL: " + req.email);
        System.out.println("PASSWORD: " + req.password);
        System.out.println("=========================================");

        User user = repo.findByEmail(req.email);

        // Email not found
        if (user == null) {
            System.out.println("Login failed: Email not found.");
            return new LoginResponse(false, "Email not found", null, -1);
        }

        // Debug actual DB values
        System.out.println("DB Email Match: TRUE");
        System.out.println("DB Password: " + user.getPassword());
        System.out.println("DB Role: " + user.getRole());

        // Password mismatch
        if (!user.getPassword().equals(req.password)) {
            System.out.println("Login failed: Incorrect password.");
            return new LoginResponse(false, "Incorrect password", null, -1);
        }

        // Login success
        System.out.println("Login successful!");
        System.out.println("User Role: " + user.getRole());
        System.out.println("User ID: " + user.getId());

        return new LoginResponse(
                true,
                "Login successful",
                user.getRole(),
                user.getId());
    }
}
