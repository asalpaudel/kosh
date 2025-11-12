// FixedDepositRepository.java
package com.kosh.backend.repository;

import com.kosh.backend.model.FixedDeposit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FixedDepositRepository extends JpaRepository<FixedDeposit, Long> {
    List<FixedDeposit> findByNetworkId(Long networkId);
}
