package com.kosh.backend.repository;

import com.kosh.backend.model.SavingAccountApplication;
import com.kosh.backend.model.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SavingAccountApplicationRepository extends JpaRepository<SavingAccountApplication, Long> {
    List<SavingAccountApplication> findByNetworkId(Long networkId);
    List<SavingAccountApplication> findByUserId(Long userId);
    List<SavingAccountApplication> findByNetworkIdAndStatus(Long networkId, ApplicationStatus status);
    List<SavingAccountApplication> findByNetworkIdAndStatusOrderByIdAsc(Long networkId, ApplicationStatus status);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select application from SavingAccountApplication application where application.id = :id")
    Optional<SavingAccountApplication> findByIdForReview(@Param("id") Long id);
}
