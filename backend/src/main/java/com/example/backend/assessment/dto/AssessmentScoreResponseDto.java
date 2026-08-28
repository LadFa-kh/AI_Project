package com.example.backend.assessment.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class AssessmentScoreResponseDto {
    private UUID resumeId;
    private BigDecimal resumeScore;      // คะแนนจาก Resume (เช่น 80.00)
    private BigDecimal assessmentScore;  // คะแนนประเมินตนเอง (เช่น 75.00)
    private BigDecimal finalScore;       // คะแนนรวมสรุป (เช่น 78.00)
    private List<String> missingSkills;
    private String recommendationSummary;
    private List<String> recommendationItems;
}