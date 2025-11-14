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
        updatedUser.setId(id);
        return repo.save(updatedUser);
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
    @GetMapping
    public List<User> getAllUsers(
            @RequestParam(value = "search", required = false) String search) {
        
        if (search != null && !search.isEmpty()) {
            System.out.println("Searching users for: " + search);
            return repo.findByNameContainingIgnoreCase(search);
        } else {
            return repo.findAll();
        }
    }
}