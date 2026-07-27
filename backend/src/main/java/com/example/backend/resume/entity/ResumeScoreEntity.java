package com.example.backend.resume.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "resume_score")
public class ResumeScoreEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Foreign Key แบบ One-to-One เชื่อมกับ Resume
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false, unique = true) // unique=true ช่วยป้องกันไม่ให้ Resume เดิมมีคะแนนซ้ำซ้อน
    private ResumeEntity resume;

    @Column(name = "resume_score")
    private BigDecimal resumeScore;

    @Column(name = "breakdown_json", columnDefinition = "TEXT")
    private String breakDownJson;
}
