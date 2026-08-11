package com.kosh.backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.kosh.backend.model.LoanGuarantor;

public interface LoanGuarantorRepository extends JpaRepository<LoanGuarantor, Long> {
    List<LoanGuarantor> findByLoanApplicationIdOrderByIdAsc(Long loanApplicationId);
    List<LoanGuarantor> findByLoanApplicationIdAndStatus(Long loanApplicationId, String status);
    List<LoanGuarantor> findByGuarantorIdAndStatus(Long guarantorId, String status);
}
