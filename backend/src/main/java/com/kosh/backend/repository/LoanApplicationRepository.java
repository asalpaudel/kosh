package com.kosh.backend.repository;

import com.kosh.backend.model.LoanApplication;
import com.kosh.backend.model.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LoanApplicationRepository extends JpaRepository<LoanApplication, Long> {
    List<LoanApplication> findByNetworkId(Long networkId);
    List<LoanApplication> findByUserId(Long userId);
    List<LoanApplication> findByNetworkIdAndStatus(Long networkId, ApplicationStatus status);
}