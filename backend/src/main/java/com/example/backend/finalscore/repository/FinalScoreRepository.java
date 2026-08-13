package com.example.backend.finalscore.repository;

import com.example.backend.finalscore.entity.FinalScoreEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FinalScoreRepository extends JpaRepository<FinalScoreEntity, UUID> {
    Optional<FinalScoreEntity> findByResume_Id(UUID resumeId);
    Optional<FinalScoreEntity> findByUserIdAndResumeId(UUID userId, UUID resumeId);

}
