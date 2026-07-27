package com.example.backend.assessment.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class SubmitAssessmentRequestDto {
    private UUID userId;
    private UUID resumeId;
    private List<AnswerItem> answers;

    @Data
    public static class AnswerItem {
        private UUID questionId;
        private Integer selectedScore; // ค่าคะแนน 1, 2, 3, 4
    }
}