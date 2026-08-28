package com.example.backend.assessment.repository;

import com.example.backend.assessment.entity.AssessmentScoreEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssessmentScoreRepository extends JpaRepository<AssessmentScoreEntity, UUID> {
    Optional<AssessmentScoreEntity> findByResume_Id(UUID resumeId);
    boolean existsByResume_Id(UUID resumeId);
}