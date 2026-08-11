package com.kosh.backend.repository;

import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.kosh.backend.model.LoanClassification;

public interface LoanClassificationRepository extends JpaRepository<LoanClassification, Long> {
    Optional<LoanClassification> findByLoanApplicationIdAndClassificationDate(Long loanId, LocalDate date);
}
