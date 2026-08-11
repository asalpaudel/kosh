package com.kosh.backend.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.kosh.backend.model.LoanRiskSetting;

public interface LoanRiskSettingRepository extends JpaRepository<LoanRiskSetting, Long> {
    Optional<LoanRiskSetting> findByNetworkId(Long networkId);
}
