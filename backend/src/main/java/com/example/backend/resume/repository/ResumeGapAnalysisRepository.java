package com.example.backend.resume.repository;

import com.example.backend.resume.entity.ResumeGapAnalysisEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ResumeGapAnalysisRepository extends JpaRepository<ResumeGapAnalysisEntity, UUID> {
    Optional<ResumeGapAnalysisEntity> findByResume_Id(UUID resumeId);
}