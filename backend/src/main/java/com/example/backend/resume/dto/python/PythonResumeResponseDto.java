package com.example.backend.resume.dto.python;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PythonResumeResponseDto {

    private ResumeData resume_data;
    private List<QuestionData> questions;

    @Getter
    @Setter
    public static class ResumeData {
        private List<String> hard_skills;
        private List<String> soft_skills;
    }

    @Getter
    @Setter
    public static class QuestionData {
        private String id;
        private String question;
        private List<String> options;
    }
}