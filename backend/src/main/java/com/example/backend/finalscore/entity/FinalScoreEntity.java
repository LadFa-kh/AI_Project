package com.example.backend.finalscore.entity;

import com.example.backend.resume.entity.ResumeEntity;
import com.example.backend.user.entity.UserEntity;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "final_score")
public class FinalScoreEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false,unique = true)
    private ResumeEntity resume;

    @Column(name = "resume_score", precision = 5, scale = 2)
    private BigDecimal resumeScore;   // เก็บได้ถึง 999.99 พอสำหรับคะแนนเต็ม 100

    @Column(name = "assessment_score", precision = 5, scale = 2)
    private BigDecimal assessmentScore;

    @Column(name = "final_score", precision = 5, scale = 2)
    private BigDecimal finalScore;
}
