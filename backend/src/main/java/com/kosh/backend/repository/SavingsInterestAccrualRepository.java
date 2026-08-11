package com.kosh.backend.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kosh.backend.model.SavingsInterestAccrual;

public interface SavingsInterestAccrualRepository extends JpaRepository<SavingsInterestAccrual, Long> {
    Optional<SavingsInterestAccrual> findBySavingAccountIdAndMemberIdAndAccrualDate(
            Long savingAccountId, Long memberId, LocalDate accrualDate);
    List<SavingsInterestAccrual> findBySavingAccountIdAndMemberIdAndAccrualDateBetweenOrderByAccrualDateAsc(
            Long savingAccountId, Long memberId, LocalDate start, LocalDate end);
    List<SavingsInterestAccrual> findByNetworkIdOrderByAccrualDateDescIdDesc(Long networkId);
}
