package com.kosh.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import com.kosh.backend.model.ShareCertificate;

import jakarta.persistence.LockModeType;

public interface ShareCertificateRepository extends JpaRepository<ShareCertificate, Long> {
    Optional<ShareCertificate> findByNetworkIdAndMemberId(Long networkId, Long memberId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<ShareCertificate> findForUpdateByNetworkIdAndMemberId(Long networkId, Long memberId);

    List<ShareCertificate> findByNetworkIdOrderByCertificateNumberAsc(Long networkId);
    boolean existsByNetworkIdAndSharesHeldGreaterThan(Long networkId, Integer sharesHeld);
}
