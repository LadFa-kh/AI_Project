package com.example.backend.assessment.repository;

import com.example.backend.assessment.entity.AssessmentAnswerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface AssessmentAnswerRepository extends JpaRepository<AssessmentAnswerEntity, UUID> {
    List<AssessmentAnswerEntity> findByUserIdAndQuestion_Resume_Id(UUID userId, UUID resumeId);
    boolean existsByUserIdAndQuestionId(UUID userId, UUID questionId);   // กันตอบซ้ำ
}