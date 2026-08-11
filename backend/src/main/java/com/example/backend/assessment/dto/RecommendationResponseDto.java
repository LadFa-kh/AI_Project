package com.example.backend.assessment.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RecommendationResponseDto {
    private List<String> missing_skills;
    private String recommendation;
}