package com.kosh.backend.repository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kosh.backend.model.ProcessingDateLock;

public interface ProcessingDateLockRepository extends JpaRepository<ProcessingDateLock, Long> {
    @Modifying
    @Query(value = """
            INSERT INTO processing_date_locks (network_id, process_type, processing_date, scope_key, started_at)
            VALUES (:networkId, :processType, :processingDate, :scopeKey, CURRENT_TIMESTAMP)
            ON CONFLICT (network_id, process_type, processing_date, scope_key) DO NOTHING
            """, nativeQuery = true)
    int tryAcquire(@Param("networkId") Long networkId, @Param("processType") String processType,
            @Param("processingDate") LocalDate processingDate, @Param("scopeKey") String scopeKey);

    Optional<ProcessingDateLock> findByNetworkIdAndProcessTypeAndProcessingDateAndScopeKey(
            Long networkId, String processType, LocalDate processingDate, String scopeKey);

    @Modifying
    @Query("UPDATE ProcessingDateLock p SET p.completedAt = :completedAt, p.completedBy = :completedBy "
            + "WHERE p.id = :id AND p.completedAt IS NULL")
    int complete(@Param("id") Long id, @Param("completedAt") Instant completedAt,
            @Param("completedBy") String completedBy);
}
