package com.example.backend.finalscore.repository;

import com.example.backend.finalscore.entity.FinalScoreEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface FinalScoreRepository extends JpaRepository<FinalScoreEntity, UUID> {
    Optional<FinalScoreEntity> findByResumeId(UUID resumeId);   // ใช้ตอน GET /results/{resumeId}
}
