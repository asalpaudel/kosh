package com.kosh.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kosh.backend.model.ShareTransaction;

public interface ShareTransactionRepository extends JpaRepository<ShareTransaction, Long> {
    Optional<ShareTransaction> findByNetworkIdAndRequestRef(Long networkId, String requestRef);
    List<ShareTransaction> findByNetworkIdOrderByTransactionDateDescIdDesc(Long networkId);
    List<ShareTransaction> findByNetworkIdAndFromMemberIdOrNetworkIdAndToMemberIdOrderByTransactionDateDescIdDesc(
            Long fromNetworkId, Long fromMemberId, Long toNetworkId, Long toMemberId);
}
