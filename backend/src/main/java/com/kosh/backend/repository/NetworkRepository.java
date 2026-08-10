package com.kosh.backend.repository;

import com.kosh.backend.model.Network;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

@Repository
public interface NetworkRepository extends JpaRepository<Network, Long> {

    // 🔍 Find network by name
    Network findByName(String name);

    // ❌ Removed countByStatus — Network has no status
    // ✅ Instead, you can count by packageType if needed
    long countByPackageType(String packageType);

    // 1️⃣ Monthly revenue per package type (Basic, Premium, Custom)
    @Query(
        value = "SELECT SUBSTRING(created_at FROM 1 FOR 7) AS month, " +
                "SUM(CASE WHEN package_type = 'Basic' THEN package_price ELSE 0 END) AS basic, " +
                "SUM(CASE WHEN package_type = 'Premium' THEN package_price ELSE 0 END) AS premium, " +
                "SUM(CASE WHEN package_type = 'Custom' THEN package_price ELSE 0 END) AS custom " +
                "FROM networks " +
                "GROUP BY SUBSTRING(created_at FROM 1 FOR 7) " +
                "ORDER BY month ASC",
        nativeQuery = true
    )
    List<Object[]> getMonthlyRevenueByType();

    // 2️⃣ Total revenue by type (Basic, Premium, Custom)
    @Query(
        value = "SELECT package_type, SUM(package_price) AS total " +
                "FROM networks " +
                "GROUP BY package_type",
        nativeQuery = true
    )
    List<Object[]> getTotalRevenueByType();
}
