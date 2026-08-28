package com.example.backend.resume.dto;

import com.example.backend.resume.dto.python.PythonResumeResponseDto;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ResumeUploadResponseDto {
    private UUID resumeId;
    private List<String> extractedSkills;
    private List<PythonResumeResponseDto.QuestionData> questions;
}
