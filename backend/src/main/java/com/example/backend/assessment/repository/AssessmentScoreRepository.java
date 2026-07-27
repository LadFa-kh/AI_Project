package com.example.backend.assessment.repository;

import com.example.backend.assessment.entity.AssessmentScoreEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface AssessmentScoreRepository extends JpaRepository<AssessmentScoreEntity, UUID> {
    Optional<AssessmentScoreEntity> findByResumeId(UUID resumeId);
}