package com.kosh.backend.controller;

import java.util.List;

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

    @GetMapping("/{id}")
    public User getUserById(@PathVariable int id) {
        return repo.findById(id).orElse(null);
    }

    @PutMapping("/{id}")
    public User updateUser(@PathVariable int id, @RequestBody User updatedUser) {
        updatedUser.setId(id);
        return repo.save(updatedUser);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable int id) {
        repo.deleteById(id);
    }
}