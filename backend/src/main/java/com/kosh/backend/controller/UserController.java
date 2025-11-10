package com.kosh.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

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
    public User createUser(@RequestBody User user) {
        System.out.println("POST /api/users hit!");
        System.out.println("Received user: " + user);
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
