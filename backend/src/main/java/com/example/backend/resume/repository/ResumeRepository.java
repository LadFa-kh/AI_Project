package com.example.backend.resume.repository;

import com.example.backend.resume.entity.ResumeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ResumeRepository extends JpaRepository<ResumeEntity, UUID> {
    Optional<ResumeEntity> findByFileHash(String fileHash);   // ใช้เช็ค idempotency
}
