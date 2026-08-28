package com.example.backend.resume.repository;

import com.example.backend.resume.entity.ResumeScoreEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResumeScoreRepository extends JpaRepository<ResumeScoreEntity, UUID> {
    Optional<ResumeScoreEntity> findByResume_Id(UUID resumeId);
}