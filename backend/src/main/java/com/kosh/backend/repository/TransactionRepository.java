package com.kosh.backend.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.kosh.backend.model.Transaction;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    
    List<Transaction> findByNetworkIdOrderByDateDesc(Long networkId);
    List<Transaction> findByUserIdOrderByDateDesc(Long userId);

    // Sum Credits (Deposits) - Debits (Withdrawals) for a specific account head
    // Used for Savings and Fixed Deposits
    @Query("SELECT COALESCE(SUM(CASE WHEN t.direction = 'Credit' THEN t.amount ELSE -t.amount END), 0) " +
           "FROM Transaction t WHERE t.network.id = :networkId AND t.accountHead = :head")
    BigDecimal getBalanceByHead(@Param("networkId") Long networkId, @Param("head") String head);

    // Sum Loans: For Loans, 'Debit' means Disbursement (money out → loan increases)
    // 'Credit' means Repayment (money in → loan decreases)
    // We sum Debits (Disbursed) - Credits (Repaid) to get Outstanding Loan Amount
    @Query("SELECT COALESCE(SUM(CASE WHEN t.direction = 'Debit' THEN t.amount ELSE -t.amount END), 0) " +
           "FROM Transaction t WHERE t.network.id = :networkId AND t.accountHead = 'Loan'")
    BigDecimal getOutstandingLoans(@Param("networkId") Long networkId);

    // ⭐ NEW: Sum Network Income/Expense (Credits - Debits) where mode is 'network'
    @Query("SELECT COALESCE(SUM(CASE WHEN t.direction = 'Credit' THEN t.amount ELSE -t.amount END), 0) " +
           "FROM Transaction t WHERE t.network.id = :networkId AND t.mode = 'network'")
    BigDecimal getNetworkBalance(@Param("networkId") Long networkId);
}