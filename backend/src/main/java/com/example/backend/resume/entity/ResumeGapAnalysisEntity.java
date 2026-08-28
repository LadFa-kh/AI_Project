package com.example.backend.resume.entity;

import com.example.backend.resume.entity.ResumeEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "resume_gap_analysis")
@Getter
@Setter
public class ResumeGapAnalysisEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "resume_id", nullable = false, unique = true)
    private ResumeEntity resume;

    @Column(columnDefinition = "TEXT")
    private String missingSkills;

    @Column(columnDefinition = "TEXT")
    private String recommendation;

    private Instant createdAt;
}