package com.kosh.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kosh.backend.model.RepaymentSchedule;

public interface RepaymentScheduleRepository extends JpaRepository<RepaymentSchedule, Long> {
    List<RepaymentSchedule> findByLoanApplicationIdOrderByDueDateAsc(Long loanApplicationId);
}