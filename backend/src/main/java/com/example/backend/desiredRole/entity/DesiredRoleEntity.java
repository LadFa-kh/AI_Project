package com.example.backend.desiredRole.entity;

import com.example.backend.resume.entity.ResumeEntity;
import com.example.backend.user.entity.UserEntity;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Entity
@Table(name = "desired_roles")
public class DesiredRoleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false) // <--- อันนี้ระบุว่าเป็นของใครอยู่แล้วครับ
    private UserEntity user;

    @Column(name = "role_name")
    private String roleName;


    @Column(name = "created_at", updatable = false) // updatable = false ห้ามอัปเดตเวลาสร้างซ้ำ
    private Instant createdAt;

    // 1. เพิ่มฟิลด์สำหรับบันทึกเวลาอัปเดตล่าสุด
    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToOne
    @JoinColumn(name = "resume_id", nullable = true)
    private ResumeEntity resume;

    // 2. เพิ่ม Lifecycle Callbacks เพื่อปั๊มเวลาอัตโนมัติ
    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

}