package com.kosh.backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.kosh.backend.model.LoanCollateral;

public interface LoanCollateralRepository extends JpaRepository<LoanCollateral, Long> {
    List<LoanCollateral> findByLoanApplicationIdOrderByIdAsc(Long loanApplicationId);
    List<LoanCollateral> findByNetworkIdOrderByIdDesc(Long networkId);
    List<LoanCollateral> findByLoanApplicationIdAndStatus(Long loanApplicationId, String status);
}
