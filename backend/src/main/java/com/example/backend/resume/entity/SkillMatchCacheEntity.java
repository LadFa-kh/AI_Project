package com.example.backend.resume.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/**
 * B2: เก็บคำตัดสินของ LLM ว่าคู่ทักษะนี้ "ตรงกัน" ไหม
 * คู่เดิมเจออีกครั้งจะอ่านจากตารางนี้ ไม่ต้องเรียก LLM ซ้ำ (ประหยัดเงินและเวลา + ผลคงที่)
 * คีย์ = ชื่อทักษะหลัง normalize ทั้งสองฝั่ง
 */
@Data
@Entity
@Table(name = "skill_match_cache",
        uniqueConstraints = @UniqueConstraint(name = "uk_skill_pair", columnNames = {"resume_skill_key", "standard_skill_key"}))
public class SkillMatchCacheEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "resume_skill_key", nullable = false, length = 300)
    private String resumeSkillKey;

    @Column(name = "standard_skill_key", nullable = false, length = 300)
    private String standardSkillKey;

    @Column(name = "is_match", nullable = false)
    private boolean match;

    private Double confidence;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }
}
