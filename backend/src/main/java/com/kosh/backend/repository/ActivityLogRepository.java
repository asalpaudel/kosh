package com.kosh.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.kosh.backend.model.ActivityLog;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    // For Admin: Get logs specific to their network
    List<ActivityLog> findBySahakariIdOrderByTimestampDesc(Long sahakariId);
    
    // For Superadmin: Get all logs or filter by role
    List<ActivityLog> findAllByOrderByTimestampDesc();
    List<ActivityLog> findByRoleOrderByTimestampDesc(String role);
}