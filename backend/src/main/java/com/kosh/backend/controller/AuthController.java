package com.kosh.backend.controller;

import org.springframework.web.bind.annotation.*;
import com.kosh.backend.model.User;
import com.kosh.backend.model.Network;
import com.kosh.backend.repository.UserRepository;
import com.kosh.backend.repository.NetworkRepository;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true") // Added allowCredentials
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

        public LoginResponse(boolean success, String message, String role, int userId, Long networkId) {
            this.success = success;
            this.message = message;
            this.role = role;
            this.userId = userId;
            this.networkId = networkId;
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

        Long networkId = null;

        if (!user.getRole().equals("superadmin")) {
            Network net = networkRepo.findByName(user.getSahakari());
            if (net != null) {
                networkId = net.getId();
            }
        }

        session.setAttribute("userEmail", user.getEmail());
        session.setAttribute("sahakariId", networkId);

        System.out.println("User logged in: " + user.getEmail());
        System.out.println("Session sahakariId set to: " + session.getAttribute("sahakariId"));
        System.out.println("Session ID: " + session.getId());

        return new LoginResponse(
                true,
                "Login successful",
                user.getRole(),
                user.getId(),
                networkId);
    }
}