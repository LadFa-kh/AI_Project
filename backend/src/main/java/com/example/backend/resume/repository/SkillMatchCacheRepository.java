package com.example.backend.resume.repository;

import com.example.backend.resume.entity.SkillMatchCacheEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface SkillMatchCacheRepository extends JpaRepository<SkillMatchCacheEntity, UUID> {
    List<SkillMatchCacheEntity> findByResumeSkillKeyIn(Collection<String> resumeSkillKeys);
}
