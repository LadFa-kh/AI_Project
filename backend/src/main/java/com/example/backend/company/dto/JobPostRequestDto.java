package com.example.backend.company.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class JobPostRequestDto {
    private UUID employerId;
    private String companyName;
    private String jobType;
    private String positionName;
    private String requiredSkills;
    private String jobDescription;
    private String duration;
    private String salary;
    private String contactLink;

    // B3: ไม่บังคับ — ไม่ส่งมา = OPEN
    private String status;
    private java.time.LocalDate openDate;
    private java.time.LocalDate closeDate;
}
