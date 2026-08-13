package com.example.backend.company.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class JobPostRequestDto {
    private UUID employerId;
    private String companyName;
    private String jobType;
    private String positionName;
    private List <String> requiredSkills;
}