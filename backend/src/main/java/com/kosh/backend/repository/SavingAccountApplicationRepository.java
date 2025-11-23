package com.kosh.backend.repository;

import com.kosh.backend.model.SavingAccountApplication;
import com.kosh.backend.model.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SavingAccountApplicationRepository extends JpaRepository<SavingAccountApplication, Long> {
    List<SavingAccountApplication> findByNetworkId(Long networkId);
    List<SavingAccountApplication> findByUserId(Long userId);
    List<SavingAccountApplication> findByNetworkIdAndStatus(Long networkId, ApplicationStatus status);
}