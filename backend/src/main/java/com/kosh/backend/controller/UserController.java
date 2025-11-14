package com.kosh.backend.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.*;
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
            @RequestParam(value = "document", required = false) MultipartFile document) {
        
        System.out.println("POST /api/users hit!");
        System.out.println("Received user: " + name + ", " + email);
        
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPhone(phone);
        user.setRole(role);
        user.setSahakari(sahakari);
        user.setPassword(password);
        user.setStatus("Pending"); 
        
        // Handle document if needed
        if (document != null && !document.isEmpty()) {
            System.out.println("Document received: " + document.getOriginalFilename());
            // TODO: Save the document file to storage and store the path/URL in the user object
            // user.setDocumentPath(savedPath);
        }
        
        User saved = repo.save(user);
        System.out.println("Saved user with ID: " + saved.getId());
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
        
        // Update only the fields that are provided, preserve the password
        existingUser.setName(updatedUser.getName());
        existingUser.setEmail(updatedUser.getEmail());
        existingUser.setPhone(updatedUser.getPhone());
        existingUser.setRole(updatedUser.getRole());
        existingUser.setSahakari(updatedUser.getSahakari());
        existingUser.setStatus(updatedUser.getStatus());
        
        // Password is NOT updated here - it remains unchanged
        // existingUser.setPassword() is NOT called
        
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