package com.example.backend.resume.repository;

import com.example.backend.resume.entity.ResumeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResumeRepository extends JpaRepository<ResumeEntity, UUID> {
    Optional<ResumeEntity> findByFileHash(String fileHash);

    /** เรซูเม่ล่าสุดของผู้ใช้ — ใช้เทียบทักษะกับประกาศงาน */
    Optional<ResumeEntity> findFirstByUserEntity_IdOrderByUploadedAtDesc(UUID userId);   // ใช้เช็ค idempotency
}
