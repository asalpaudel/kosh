package com.kosh.backend.controller;

import java.util.List;
import java.util.stream.Collectors;

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

import com.kosh.backend.model.User;
import com.kosh.backend.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository repo;

    public UserController(UserRepository repo) {
        this.repo = repo;
    }

   @PostMapping
    public User createUser(
            @RequestParam("name") String name,
            @RequestParam("email") String email,
            @RequestParam("phone") String phone,
            @RequestParam("role") String role,
            @RequestParam("sahakari") String sahakari,
            @RequestParam("password") String password,
            @RequestParam(value = "status", required = false) String status,  // ⭐ Removed defaultValue
            @RequestParam(value = "document", required = false) MultipartFile document) {
        
        System.out.println("POST /api/users hit!");
        System.out.println("Received user: " + name + ", " + email);
        System.out.println("Status parameter received: " + status);
        
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPhone(phone);
        user.setRole(role);
        user.setSahakari(sahakari);
        user.setPassword(password);
        
        // ⭐ Set status: use provided value, or default to "Pending" if not provided
        if (status != null && !status.trim().isEmpty()) {
            user.setStatus(status);
            System.out.println("Setting user status to: " + status);
        } else {
            user.setStatus("Pending");
            System.out.println("Setting user status to: Pending (default)");
        }
        
        // Handle document if needed
        if (document != null && !document.isEmpty()) {
            System.out.println("Document received: " + document.getOriginalFilename());
            // TODO: Save the document file to storage and store the path/URL in the user object
            // user.setDocumentPath(savedPath);
        }
        
        User saved = repo.save(user);
        System.out.println("Saved user with ID: " + saved.getId());
        System.out.println("Saved user status: " + saved.getStatus());
        return saved;
    }

    @GetMapping
    public List<User> getAllUsers() {
        return repo.findAll();
    }


    @GetMapping("/pending")
    public List<User> getPendingUsers(@RequestParam String sahakari) {
        return repo.findAll().stream()
                .filter(u -> "Pending".equals(u.getStatus()) && sahakari.equals(u.getSahakari()))
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public User getUserById(@PathVariable int id) {
        return repo.findById(id).orElse(null);
    }

    @PutMapping("/{id}")
    public User updateUser(@PathVariable int id, @RequestBody User updatedUser) {
        // Fetch the existing user from database
        User existingUser = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        // Update all fields *except* password
        existingUser.setName(updatedUser.getName());
        existingUser.setEmail(updatedUser.getEmail());
        existingUser.setPhone(updatedUser.getPhone());
        existingUser.setRole(updatedUser.getRole());
        existingUser.setSahakari(updatedUser.getSahakari());
        existingUser.setStatus(updatedUser.getStatus());
        
        // --- THIS IS THE FIX ---
        // Only update the password if a new, non-empty password is provided
        // This check prevents a null or blank password from overwriting the existing one
        if (updatedUser.getPassword() != null && !updatedUser.getPassword().isEmpty()) {
            existingUser.setPassword(updatedUser.getPassword());
        }
        
        return repo.save(existingUser);
    }

    @PatchMapping("/{id}/approve")
    public User approveUser(@PathVariable int id) {
        User user = repo.findById(id).orElseThrow();
        user.setStatus("Active");
        return repo.save(user);
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
}