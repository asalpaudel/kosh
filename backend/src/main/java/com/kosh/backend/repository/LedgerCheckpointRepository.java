package com.kosh.backend.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.kosh.backend.model.LedgerCheckpoint;

public interface LedgerCheckpointRepository extends JpaRepository<LedgerCheckpoint, Long> {
    Optional<LedgerCheckpoint> findByNetworkIdAndCheckpointDate(Long networkId, LocalDate checkpointDate);
    List<LedgerCheckpoint> findTop12ByNetworkIdOrderByCheckpointDateDesc(Long networkId);
    List<LedgerCheckpoint> findByNetworkIdOrderByCheckpointDateAsc(Long networkId);
}
