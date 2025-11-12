// SavingAccountRepository.java
package com.kosh.backend.repository;

import com.kosh.backend.model.SavingAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SavingAccountRepository extends JpaRepository<SavingAccount, Long> {
    List<SavingAccount> findByNetworkId(Long networkId);
}
