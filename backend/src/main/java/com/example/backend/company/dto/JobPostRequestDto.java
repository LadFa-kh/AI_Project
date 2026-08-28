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
}