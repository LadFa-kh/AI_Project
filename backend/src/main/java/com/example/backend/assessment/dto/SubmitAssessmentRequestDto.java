package com.example.backend.assessment.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class SubmitAssessmentRequestDto {
    private UUID resumeId;
    private String desiredRoleName;
    private List<AnswerItem> answers;

    @Data
    public static class AnswerItem {
        private UUID questionId;
        private Integer selectedScore;
    }
}