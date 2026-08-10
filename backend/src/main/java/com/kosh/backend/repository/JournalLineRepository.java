package com.kosh.backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.kosh.backend.model.JournalLine;

@Repository
public interface JournalLineRepository extends JpaRepository<JournalLine, Long> {

    List<JournalLine> findByEntryIdOrderByIdAsc(Long entryId);

    /** Net movement on an account, as debit minus credit. Callers apply the account's normal side. */
    @Query("""
           SELECT COALESCE(SUM(l.debit - l.credit), 0) FROM JournalLine l
           WHERE l.account.network.id = :networkId AND l.account.code = :code
           """)
    java.math.BigDecimal netMovement(@Param("networkId") Long networkId, @Param("code") String code);

    /** Net movement on an account for one member — the basis for a derived member balance. */
    @Query("""
           SELECT COALESCE(SUM(l.debit - l.credit), 0) FROM JournalLine l
           WHERE l.account.code = :code AND l.member.id = :memberId
           """)
    java.math.BigDecimal netMovementForMember(@Param("code") String code, @Param("memberId") Long memberId);

    /** Trial balance rows for a date window: account code, name, type, total debits, total credits. */
    @Query("""
           SELECT a.code, a.name, a.type, COALESCE(SUM(l.debit), 0), COALESCE(SUM(l.credit), 0)
           FROM JournalLine l JOIN l.account a JOIN l.entry e
           WHERE a.network.id = :networkId AND e.entryDate BETWEEN :from AND :to
           GROUP BY a.code, a.name, a.type
           ORDER BY a.code
           """)
    List<Object[]> trialBalance(@Param("networkId") Long networkId,
                                @Param("from") LocalDate from,
                                @Param("to") LocalDate to);

    /** Per-member movement on one account, for drift checks across a whole cooperative. */
    @Query("""
           SELECT l.member.id, COALESCE(SUM(l.credit - l.debit), 0)
           FROM JournalLine l
           WHERE l.account.network.id = :networkId AND l.account.code = :code AND l.member IS NOT NULL
           GROUP BY l.member.id
           """)
    List<Object[]> memberBalances(@Param("networkId") Long networkId, @Param("code") String code);
}
