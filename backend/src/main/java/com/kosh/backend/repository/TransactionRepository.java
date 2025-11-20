package com.kosh.backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.kosh.backend.model.Transaction;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserId(Integer userId);
    List<Transaction> findBySahakariId(Long sahakariId);
}
