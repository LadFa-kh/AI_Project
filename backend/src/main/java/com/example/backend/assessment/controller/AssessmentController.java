package com.example.backend.assessment.controller;

import com.example.backend.assessment.dto.AssessmentScoreResponseDto;
import com.example.backend.assessment.dto.SubmitAssessmentRequestDto;
import com.example.backend.assessment.service.AssessmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/assessments")
@RequiredArgsConstructor
@CrossOrigin("*")
public class AssessmentController {

    private final AssessmentService assessmentService;

    @PostMapping("/submit")
    public ResponseEntity<AssessmentScoreResponseDto> submitAssessment(@RequestBody SubmitAssessmentRequestDto request) {
        AssessmentScoreResponseDto response = assessmentService.submitAssessment(request);
        return ResponseEntity.ok(response);
    }
}
