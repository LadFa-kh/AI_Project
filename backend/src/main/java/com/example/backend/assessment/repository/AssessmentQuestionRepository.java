package com.example.backend.assessment.repository;

import com.example.backend.assessment.entity.AssessmentQuestionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AssessmentQuestionRepository extends JpaRepository<AssessmentQuestionEntity, UUID> {
    List<AssessmentQuestionEntity> findByResume_Id(UUID resumeId);
}