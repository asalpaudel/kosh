package com.kosh.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.kosh.backend.model.Account;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    List<Account> findByNetworkIdOrderByCodeAsc(Long networkId);

    Optional<Account> findByNetworkIdAndCode(Long networkId, String code);

    boolean existsByNetworkId(Long networkId);
}
