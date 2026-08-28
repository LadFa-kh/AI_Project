package com.example.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminDashboardDto {
    private long totalUsers;
    private long totalStudents;
    private long totalAdmins;
    private long totalResumes;
    private long totalAssessmentsCompleted;
    private long totalJobPostings;
    private BigDecimal averageResumeScore;
    private BigDecimal averageAssessmentScore;
    private BigDecimal averageFinalScore;
}