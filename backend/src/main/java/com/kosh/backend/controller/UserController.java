package com.kosh.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosh.backend.model.User;
import com.kosh.backend.service.UserService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") // Allow access from your React frontend
public class UserController {

    @Autowired
    private UserService userService;

    // Create user
    @PostMapping("/add/users")
    public User addUser(@RequestBody User user) {
        return userService.addUser(user);
    }

    // Get all users
    @GetMapping("/all")
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    // Get user by ID
    @GetMapping("/{id}")
    public User getUserById(@PathVariable int id) {
        return userService.getUserById(id);
    }

    // Delete user
    @DeleteMapping("/delete/{id}")
    public String deleteUser(@PathVariable int id) {
        userService.deleteUser(id);
        return "User with ID " + id + " deleted successfully.";
    }
}
