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
}