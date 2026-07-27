package com.example.backend.assessment.entity;

import com.example.backend.resume.entity.ResumeEntity;
import com.example.backend.user.entity.UserEntity;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "assessment_score")
public class AssessmentScoreEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Foreign Key เชื่อมไปที่ Resume
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    private ResumeEntity resume;

    // Foreign Key เชื่อมไปที่ User
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "assessment_score")
    private BigDecimal assessmentScore;

    @Column(name = "submitted_at")
    private Instant submittedAt;
}
