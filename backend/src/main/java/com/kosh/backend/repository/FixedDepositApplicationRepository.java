package com.kosh.backend.repository;

import com.kosh.backend.model.FixedDepositApplication;
import com.kosh.backend.model.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FixedDepositApplicationRepository extends JpaRepository<FixedDepositApplication, Long> {
    List<FixedDepositApplication> findByNetworkId(Long networkId);
    List<FixedDepositApplication> findByUserId(Long userId);
    List<FixedDepositApplication> findByNetworkIdAndStatus(Long networkId, ApplicationStatus status);
}