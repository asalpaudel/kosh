package com.kosh.backend.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kosh.backend.model.AccountingPeriod;

public interface AccountingPeriodRepository extends JpaRepository<AccountingPeriod, Long> {
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM AccountingPeriod p "
            + "WHERE p.network.id = :networkId AND p.periodStart <= :entryDate "
            + "AND p.periodEnd >= :entryDate AND p.reopenedAt IS NULL")
    boolean isDateClosed(@Param("networkId") Long networkId, @Param("entryDate") LocalDate entryDate);
    Optional<AccountingPeriod> findByNetworkIdAndPeriodTypeAndPeriodStartAndPeriodEnd(
            Long networkId, String periodType, LocalDate periodStart, LocalDate periodEnd);
    Optional<AccountingPeriod> findByIdAndNetworkId(Long id, Long networkId);
    List<AccountingPeriod> findByNetworkIdOrderByPeriodEndDescIdDesc(Long networkId);
}
