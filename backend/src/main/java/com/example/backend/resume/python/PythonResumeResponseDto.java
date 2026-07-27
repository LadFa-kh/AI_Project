package com.example.backend.resume.python;

import lombok.Data;

import java.util.List;

@Data
public class PythonResumeResponseDto {
    private ResumeData resume_data;
    private List<QuestionData> questions;

    @Data
    public static class ResumeData {
        private List<String> skills;
    }

    @Data
    public static class QuestionData {
        private Integer id;
        private String question;
        private List<String> options;
    }
}