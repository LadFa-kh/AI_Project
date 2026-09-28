package com.example.backend.assessment.entity;

import com.example.backend.resume.entity.ResumeEntity;
import com.example.backend.user.entity.UserEntity;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * ผลการประเมินฉบับเต็ม (JSON เดียวกับที่ POST /assessments/submit ตอบกลับ)
 * เก็บไว้เพื่อให้เปิดดูผลย้อนหลังได้ — เดิมผลอยู่แค่ใน sessionStorage ของเบราว์เซอร์ ปิดแท็บแล้วหาย
 */
@Data
@Entity
@Table(name = "assessment_results", indexes = @Index(name = "idx_result_user_time", columnList = "user_id, created_at"))
public class AssessmentResultEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false, unique = true)
    private ResumeEntity resume;

    @Column(name = "final_score", precision = 5, scale = 2)
    private BigDecimal finalScore;

    @Column(name = "role_used")
    private String roleUsed;

    @Column(name = "result_json", columnDefinition = "TEXT", nullable = false)
    private String resultJson;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
