package com.kosh.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kosh.backend.model.ShareSettings;

public interface ShareSettingsRepository extends JpaRepository<ShareSettings, Long> {
}
