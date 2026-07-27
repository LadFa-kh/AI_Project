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
    private BigDecimal matchPercentage;      // เปอร์เซ็นต์ความเหมาะสม (0 - 100%)
    private List<String> matchedSkills;       // ทักษะที่มีตรงกับตำแหน่งงาน
    private List<String> missingSkills;       // ทักษะที่ยังขาดอยู่ (Gap Analysis)
}