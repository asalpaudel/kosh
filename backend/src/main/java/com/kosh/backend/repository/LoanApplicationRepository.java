package com.kosh.backend.repository;

import com.kosh.backend.model.LoanApplication;
import com.kosh.backend.model.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LoanApplicationRepository extends JpaRepository<LoanApplication, Long> {
    List<LoanApplication> findByNetworkId(Long networkId);
    List<LoanApplication> findByUserId(Long userId);
    List<LoanApplication> findByNetworkIdAndStatus(Long networkId, ApplicationStatus status);
    List<LoanApplication> findByNetworkIdAndStatusOrderByIdAsc(Long networkId, ApplicationStatus status);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select application from LoanApplication application where application.id = :id")
    Optional<LoanApplication> findByIdForReview(@Param("id") Long id);
}
