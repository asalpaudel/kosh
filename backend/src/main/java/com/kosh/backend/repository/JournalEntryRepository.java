package com.kosh.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.kosh.backend.model.JournalEntry;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {

    Optional<JournalEntry> findFirstByNetworkIdOrderBySequenceNoDesc(Long networkId);

    List<JournalEntry> findByNetworkIdOrderBySequenceNoAsc(Long networkId);

    List<JournalEntry> findByNetworkIdOrderBySequenceNoDesc(Long networkId, Limit limit);

    boolean existsByReversesEntryId(Long entryId);
}
