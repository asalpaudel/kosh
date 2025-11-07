package com.kosh.backend.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.kosh.backend.model.User;
import com.kosh.backend.repository.UserRepository;
import org.springframework.lang.NonNull;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @NonNull
    public User addUser(@NonNull User user) {
        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(int id) {
        return userRepository.findById(id).orElse(null);
    }

    public void deleteUser(int id) {
        userRepository.deleteById(id);
    }
}
