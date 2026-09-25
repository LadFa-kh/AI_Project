package com.example.backend.company.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class JobMatchResponseDto {
    private UUID jobId;
    private String companyName;
    private String positionName;
    private BigDecimal userFinalScore;
    private List<String> matchedSkills;
    private List<String> missingSkills;

    /** ทักษะใน matchedSkills ที่ AI เป็นคนตัดสินว่าตรง (ไม่ตรงด้วยคำ) — ไม่มี = ไม่ส่งฟิลด์นี้ */
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
    private List<String> aiMatchedSkills;
}