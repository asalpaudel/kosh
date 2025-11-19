package com.kosh.backend.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.kosh.backend.model.Network;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.NetworkRepository;
import com.kosh.backend.repository.UserRepository;
import com.kosh.backend.util.SessionUtil;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository repo;
    private final NetworkRepository networkRepo;

    public UserController(UserRepository repo, NetworkRepository networkRepo) {
        this.repo = repo;
        this.networkRepo = networkRepo;
    }

    @PostMapping
    public ResponseEntity<?> createUser(
            @RequestParam("name") String name,
            @RequestParam("email") String email,
            @RequestParam("phone") String phone,
            @RequestParam("role") String role,
            @RequestParam("sahakari") String sahakari,
            @RequestParam("password") String password,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "document", required = false) MultipartFile document) {

        System.out.println("POST /api/users hit!");
        System.out.println("User: " + name + ", " + email);
        System.out.println("Role: " + role + ", Sahakari: " + sahakari);

        // ---------------------------------------------------------
        // ⭐ FIND NETWORK FIRST
        // ---------------------------------------------------------
        Network network = networkRepo.findAll().stream()
                .filter(n -> sahakari.equalsIgnoreCase(n.getName()))
                .findFirst()
                .orElse(null);

        if (network == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Network not found: " + sahakari));
        }

        // ---------------------------------------------------------
        // ⭐ MEMBER LIMIT VALIDATION (Using DB userLimit field)
        // ---------------------------------------------------------
        if ("member".equalsIgnoreCase(role)) {
            Integer maxMembers = network.getUserLimit();

            // Only check limit if userLimit is set (not null and not 0)
            if (maxMembers != null && maxMembers > 0) {
                long currentMembers = repo.findAll().stream()
                        .filter(u -> "member".equalsIgnoreCase(u.getRole()))
                        .filter(u -> sahakari.equalsIgnoreCase(u.getSahakari()))
                        .filter(u -> "Active".equals(u.getStatus()))
                        .count();

                System.out.println("Current members: " + currentMembers + " / " + maxMembers);

                if (currentMembers >= maxMembers) {
                    return ResponseEntity.badRequest()
                            .body(Map.of(
                                    "error", "Member limit reached. This network allows only " +
                                            maxMembers + " members."));
                }
            } else {
                System.out.println("No member limit set for this network (unlimited)");
            }
        }

        // ---------------------------------------------------------
        // ⭐ ADMIN LIMIT VALIDATION (unchanged)
        // ---------------------------------------------------------
        if ("admin".equalsIgnoreCase(role)) {
            long currentAdminCount = repo.findAll().stream()
                    .filter(u -> "admin".equalsIgnoreCase(u.getRole()))
                    .filter(u -> sahakari.equals(u.getSahakari()))
                    .filter(u -> "Active".equals(u.getStatus()))
                    .count();

            if (network.getAdminLimit() != null && currentAdminCount >= network.getAdminLimit()) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "error", "Admin limit reached for " + sahakari +
                                        ". Maximum allowed: " + network.getAdminLimit()));
            }
        }

        // ---------------------------------------------------------
        // ⭐ CREATE USER
        // ---------------------------------------------------------
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPhone(phone);
        user.setRole(role);
        user.setSahakari(sahakari);
        user.setPassword(password);

        user.setStatus((status != null && !status.isBlank()) ? status : "Pending");

        if (document != null && !document.isEmpty()) {
            System.out.println("Received document: " + document.getOriginalFilename());
        }

        User saved = repo.save(user);
        return ResponseEntity.ok(saved);
    }

    // ---------------------------------------------------------
    // REST OF ENDPOINTS
    // ---------------------------------------------------------

@GetMapping("/pending")
public ResponseEntity<?> getPendingUsers(
        @RequestParam String sahakari,
        HttpSession session) {
    
    if (!SessionUtil.isAdmin(session)) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "Only admin can view pending users"));
    }
    
    // Verify admin can only see their own sahakari's users
    Long adminSahakariId = SessionUtil.getSahakariId(session);
    // Add verification logic
    
    List<User> users = repo.findAll().stream()
            .filter(u -> "Pending".equals(u.getStatus()) && sahakari.equals(u.getSahakari()))
            .collect(Collectors.toList());
    
    return ResponseEntity.ok(users);
}

    @GetMapping("/{id}")
    public User getUserById(@PathVariable int id) {
        return repo.findById(id).orElse(null);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable int id, @RequestBody User updatedUser) {
        User existingUser = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        boolean isBecomingAdmin = "admin".equalsIgnoreCase(updatedUser.getRole()) &&
                !"admin".equalsIgnoreCase(existingUser.getRole());
        boolean isAdminChangingSahakari = "admin".equalsIgnoreCase(updatedUser.getRole()) &&
                !existingUser.getSahakari().equals(updatedUser.getSahakari());
        boolean isBecomingMember = "member".equalsIgnoreCase(updatedUser.getRole()) &&
                !"member".equalsIgnoreCase(existingUser.getRole());
        boolean isMemberChangingSahakari = "member".equalsIgnoreCase(updatedUser.getRole()) &&
                !existingUser.getSahakari().equals(updatedUser.getSahakari());

        // Check admin limit
        if (isBecomingAdmin || isAdminChangingSahakari) {
            String targetSahakari = updatedUser.getSahakari();
            Network network = networkRepo.findAll().stream()
                    .filter(n -> targetSahakari.equals(n.getName()))
                    .findFirst()
                    .orElse(null);

            if (network == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Network not found: " + targetSahakari));
            }

            long currentAdminCount = repo.findAll().stream()
                    .filter(u -> u.getId() != id)
                    .filter(u -> "admin".equalsIgnoreCase(u.getRole()))
                    .filter(u -> targetSahakari.equals(u.getSahakari()))
                    .filter(u -> "Active".equals(u.getStatus()))
                    .count();

            if (network.getAdminLimit() != null && currentAdminCount >= network.getAdminLimit()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Admin limit reached"));
            }
        }

        // Check member limit
        if (isBecomingMember || isMemberChangingSahakari) {
            String targetSahakari = updatedUser.getSahakari();
            Network network = networkRepo.findAll().stream()
                    .filter(n -> targetSahakari.equals(n.getName()))
                    .findFirst()
                    .orElse(null);

            if (network == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Network not found: " + targetSahakari));
            }

            Integer maxMembers = network.getUserLimit();

            if (maxMembers != null && maxMembers > 0) {
                long currentMembers = repo.findAll().stream()
                        .filter(u -> u.getId() != id)
                        .filter(u -> "member".equalsIgnoreCase(u.getRole()))
                        .filter(u -> targetSahakari.equals(u.getSahakari()))
                        .filter(u -> "Active".equals(u.getStatus()))
                        .count();

                if (currentMembers >= maxMembers) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Member limit reached"));
                }
            }
        }

        existingUser.setName(updatedUser.getName());
        existingUser.setEmail(updatedUser.getEmail());
        existingUser.setPhone(updatedUser.getPhone());
        existingUser.setRole(updatedUser.getRole());
        existingUser.setSahakari(updatedUser.getSahakari());
        existingUser.setStatus(updatedUser.getStatus());

        if (updatedUser.getPassword() != null && !updatedUser.getPassword().isEmpty()) {
            existingUser.setPassword(updatedUser.getPassword());
        }

        return ResponseEntity.ok(repo.save(existingUser));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<?> approveUser(@PathVariable int id) {
        User user = repo.findById(id).orElseThrow();

        Network network = networkRepo.findAll().stream()
                .filter(n -> user.getSahakari().equals(n.getName()))
                .findFirst()
                .orElse(null);

        if (network == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Network not found"));
        }

        // Check admin limit for admin users
        if ("admin".equalsIgnoreCase(user.getRole())) {
            long currentAdminCount = repo.findAll().stream()
                    .filter(u -> u.getId() != id)
                    .filter(u -> "admin".equalsIgnoreCase(u.getRole()))
                    .filter(u -> user.getSahakari().equals(u.getSahakari()))
                    .filter(u -> "Active".equals(u.getStatus()))
                    .count();

            if (network.getAdminLimit() != null && currentAdminCount >= network.getAdminLimit()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Admin limit reached"));
            }
        }

        // Check member limit for member users
        if ("member".equalsIgnoreCase(user.getRole())) {
            Integer maxMembers = network.getUserLimit();

            if (maxMembers != null && maxMembers > 0) {
                long currentMembers = repo.findAll().stream()
                        .filter(u -> u.getId() != id)
                        .filter(u -> "member".equalsIgnoreCase(u.getRole()))
                        .filter(u -> user.getSahakari().equals(u.getSahakari()))
                        .filter(u -> "Active".equals(u.getStatus()))
                        .count();

                if (currentMembers >= maxMembers) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Member limit reached"));
                }
            }
        }

        user.setStatus("Active");
        return ResponseEntity.ok(repo.save(user));
    }

    @PatchMapping("/{id}/reject")
    public User rejectUser(@PathVariable int id) {
        User user = repo.findById(id).orElseThrow();
        user.setStatus("Rejected");
        return repo.save(user);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable int id) {
        repo.deleteById(id);
    }

    @GetMapping
    public List<User> getAllUsers(
            @RequestParam(value = "search", required = false) String search) {

        if (search != null && !search.isEmpty()) {
            return repo.findByNameContainingIgnoreCase(search);
        } else {
            return repo.findAll();
        }
    }
}