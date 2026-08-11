package com.kosh.backend.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.kosh.backend.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    User findByEmail(String email);

    List<User> findByNameContainingIgnoreCase(String name);

    List<User> findBySahakari(String sahakari);

    List<User> findBySahakariIdAndRoleIgnoreCaseOrderByNameAsc(Long sahakariId, String role);

    long countByRole(String role);

    long countByRoleIgnoreCase(String role);

    // ⭐ NEW: Sum of balance for all users in a specific network
    @Query("SELECT COALESCE(SUM(u.balance), 0) FROM User u WHERE u.sahakariId = :networkId")
    BigDecimal getTotalUserBalanceByNetwork(@Param("networkId") Long networkId);
}
