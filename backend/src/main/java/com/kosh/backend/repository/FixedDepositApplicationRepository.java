package com.kosh.backend.repository;

import com.kosh.backend.model.FixedDepositApplication;
import com.kosh.backend.model.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FixedDepositApplicationRepository extends JpaRepository<FixedDepositApplication, Long> {
    List<FixedDepositApplication> findByNetworkId(Long networkId);
    List<FixedDepositApplication> findByUserId(Long userId);
    List<FixedDepositApplication> findByNetworkIdAndStatus(Long networkId, ApplicationStatus status);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select application from FixedDepositApplication application where application.id = :id")
    Optional<FixedDepositApplication> findByIdForReview(@Param("id") Long id);
}
