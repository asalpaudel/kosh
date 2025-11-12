// LoanPackageRepository.java
package com.kosh.backend.repository;

import com.kosh.backend.model.LoanPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LoanPackageRepository extends JpaRepository<LoanPackage, Long> {
    List<LoanPackage> findByNetworkId(Long networkId);
}
