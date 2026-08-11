package com.kosh.backend.repository;

import java.util.List;
import java.time.LocalDate;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kosh.backend.model.RepaymentSchedule;

public interface RepaymentScheduleRepository extends JpaRepository<RepaymentSchedule, Long> {
    List<RepaymentSchedule> findByLoanApplicationIdOrderByDueDateAsc(Long loanApplicationId);

    @org.springframework.data.jpa.repository.Query("""
            SELECT COUNT(schedule) FROM RepaymentSchedule schedule
            WHERE schedule.loanApplication.user.id = :userId AND schedule.dueDate < :date
              AND schedule.status <> 'PAID'
            """)
    long countOverdueForMember(@org.springframework.data.repository.query.Param("userId") Long userId,
            @org.springframework.data.repository.query.Param("date") LocalDate date);
}
