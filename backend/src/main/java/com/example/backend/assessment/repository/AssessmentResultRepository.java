package com.example.backend.assessment.repository;

import com.example.backend.assessment.entity.AssessmentResultEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssessmentResultRepository extends JpaRepository<AssessmentResultEntity, UUID> {
    Optional<AssessmentResultEntity> findByResume_Id(UUID resumeId);
    List<AssessmentResultEntity> findByUser_Id(UUID userId);
    void deleteByResume_Id(UUID resumeId);
}
