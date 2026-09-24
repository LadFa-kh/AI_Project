package com.example.backend.importer;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ImportLogRepository extends JpaRepository<ImportLogEntity, UUID> {
    Page<ImportLogEntity> findByImportTypeOrderByCreatedAtDesc(String importType, Pageable pageable);
}
