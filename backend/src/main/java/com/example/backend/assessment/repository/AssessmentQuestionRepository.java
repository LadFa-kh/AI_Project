package com.example.backend.assessment.repository;

import com.example.backend.assessment.entity.AssessmentQuestionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface AssessmentQuestionRepository extends JpaRepository<AssessmentQuestionEntity, UUID> {
    List<AssessmentQuestionEntity> findByResumeId(UUID resumeId);
}