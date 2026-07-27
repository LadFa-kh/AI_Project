package com.example.backend.resume.repository;

import com.example.backend.resume.entity.ResumeScoreEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface ResumeScoreRepository extends JpaRepository<ResumeScoreEntity, UUID> {
    Optional<ResumeScoreEntity> findByResumeId(UUID resumeId);
}