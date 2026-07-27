package com.example.backend.assessment.controller;

import com.example.backend.assessment.dto.AssessmentScoreResponseDto;
import com.example.backend.assessment.dto.SubmitAssessmentRequestDto;
import com.example.backend.assessment.service.AssessmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/assessments")
@RequiredArgsConstructor
public class AssessmentController {

    private final AssessmentService assessmentService;

    @PostMapping("/submit")
    public ResponseEntity<AssessmentScoreResponseDto> submitAssessment(@RequestBody SubmitAssessmentRequestDto request) {
        try {
            AssessmentScoreResponseDto response = assessmentService.submitAssessment(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
