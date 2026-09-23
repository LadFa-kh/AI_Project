package com.example.backend.user.consent;

import com.example.backend.user.entity.UserEntity;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/** B9: บันทึกการยอมรับนโยบาย (PDPA) — เก็บทุกครั้ง ไม่แก้ทับ เพื่อเป็นหลักฐานย้อนหลัง */
@Data
@Entity
@Table(name = "user_consents", indexes = @Index(name = "idx_consent_user", columnList = "user_id"))
public class UserConsentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    /** PRIVACY_POLICY (เผื่ออนาคตมี TERMS / MARKETING) */
    @Column(name = "policy_type", length = 30, nullable = false)
    private String policyType = "PRIVACY_POLICY";

    @Column(name = "policy_version", length = 20, nullable = false)
    private String policyVersion;

    @Column(name = "accepted_at", nullable = false)
    private Instant acceptedAt;

    @Column(name = "withdrawn_at")
    private Instant withdrawnAt;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "user_agent", length = 300)
    private String userAgent;
}
