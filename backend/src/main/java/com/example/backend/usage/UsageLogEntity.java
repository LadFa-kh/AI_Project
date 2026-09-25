package com.example.backend.usage;

import com.example.backend.user.entity.UserEntity;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/** B8: บันทึกการใช้งานฟีเจอร์ที่มีต้นทุน (เรียก AI) — ใช้ทั้งนับเครดิตและรายงานของ admin */
@Data
@Entity
@Table(name = "usage_logs", indexes = {
        @Index(name = "idx_usage_user_time", columnList = "user_id, created_at"),
        @Index(name = "idx_usage_action", columnList = "action")
})
public class UsageLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** null ได้ — เมื่อผู้ใช้ลบบัญชี log ถูกทำให้เป็นนิรนาม (เก็บไว้เป็นสถิติ) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @Column(length = 40, nullable = false)
    private String action;

    @Column(nullable = false)
    private boolean success;

    /** เครดิตที่หักจริง (ล้มเหลว = 0 เสมอ) */
    @Column(name = "credits_used", nullable = false)
    private int creditsUsed;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(length = 500)
    private String detail;

    // ===== Cost per action (nullable — log เก่าไม่มีค่า) =====
    @Column(name = "input_tokens")
    private Long inputTokens;

    @Column(name = "output_tokens")
    private Long outputTokens;

    @Column(name = "llm_model", length = 100)
    private String llmModel;

    /** แยกตาม endpoint ของ Python เช่น {"judge-skill-matches":{"input":..,"output":..,"calls":..}} */
    @Column(name = "token_breakdown", columnDefinition = "TEXT")
    private String tokenBreakdown;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
