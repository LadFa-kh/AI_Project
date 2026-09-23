package com.example.backend.company.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
@AllArgsConstructor
@NoArgsConstructor
public class JobDescriptionResponseDto {
    private UUID id;
    private String companyName;
    private String jobType;
    private String positionName;
    private List<String> requiredSkills;
    private String jobDescription;
    private String duration;
    private String salary;
    private String contactLink;

    // ===== ฟิลด์ใหม่ (B3/B4) — optional ทั้งหมด หน้าบ้านเก่าไม่พัง =====
    private UUID companyId;
    private String companyLogoUrl;
    private UUID postedBy;
    private String status;
    private java.time.LocalDate openDate;
    private java.time.LocalDate closeDate;
}