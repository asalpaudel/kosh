package com.kosh.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.kosh.backend.model.User;


public interface UserRepository extends JpaRepository<User, Integer> {
    User findByEmail(String email);
}