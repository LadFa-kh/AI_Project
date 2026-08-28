package com.example.backend.company.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
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
}