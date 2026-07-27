package com.example.backend.resume.entity;

import com.example.backend.user.entity.UserEntity;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "resumes")
public class ResumeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity userEntity;

    @Column(name = "file_path")
    private String filePath;

    @Column(name = "stored_filename")
    private String storedFilename;   // UUID สุ่ม ไม่ใช่ชื่อไฟล์จริง

    @Column(name = "original_filename")
    private String originalFilename;

    @Column(name = "file_hash")
    private String fileHash;         // SHA-256 สำหรับ idempotency check

    @Column(name = "raw_text", columnDefinition = "TEXT")
    private String rawText;

    @Column(name = "cleaned_text", columnDefinition = "TEXT")
    private String cleanedText;

    @Column(name = "uploaded_at")
    private Instant uploadedAt;
}
