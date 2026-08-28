package com.example.backend.assessment.repository;

import com.example.backend.assessment.entity.AssessmentAnswerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AssessmentAnswerRepository extends JpaRepository<AssessmentAnswerEntity, UUID> {

    List<AssessmentAnswerEntity> findByUser_IdAndQuestion_Resume_Id(UUID userId, UUID resumeId);
    boolean existsByUser_IdAndQuestion_Id(UUID userId, UUID questionId); // กันตอบซ้ำ
}