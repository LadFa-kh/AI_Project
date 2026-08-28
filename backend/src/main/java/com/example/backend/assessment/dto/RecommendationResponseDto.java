package com.example.backend.assessment.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponseDto {
    private List<String> missing_skills;
    private String recommendation_summary;
    private List<String> recommendation_items;
}