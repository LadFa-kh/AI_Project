package com.example.backend.resume.repository;

import com.example.backend.resume.entity.ResumeSkillEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ResumeSkillRepository extends JpaRepository<ResumeSkillEntity, UUID> {
    List<ResumeSkillEntity> findByResumeId(UUID resumeId);
}
