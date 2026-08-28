package com.example.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminResumeDto {
    // ข้อมูลเรซูเม่
    private UUID resumeId;
    private String originalFilename;
    private Instant uploadedAt;

    // เจ้าของเรซูเม่
    private UUID userId;
    private String userEmail;
    private String userFullName;

    // ทักษะที่สกัดได้
    private List<String> hardSkills;
    private List<String> softSkills;

    // ตำแหน่งงานที่ต้องการ (หรือที่ AI เดาให้)
    private String desiredRoleName;

    // คะแนน — null ถ้ายังไม่ได้ทำแบบประเมิน
    private BigDecimal resumeScore;
    private BigDecimal assessmentScore;
    private BigDecimal finalScore;
    private boolean assessmentCompleted;

    // ผลวิเคราะห์ช่องว่างทักษะ
    private List<String> missingSkills;
    private String recommendation;
}