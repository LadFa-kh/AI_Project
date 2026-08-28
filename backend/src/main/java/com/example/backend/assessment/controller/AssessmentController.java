package com.example.backend.assessment.controller;

import com.example.backend.assessment.dto.AssessmentScoreResponseDto;
import com.example.backend.assessment.dto.SubmitAssessmentRequestDto;
import com.example.backend.assessment.service.AssessmentService;
import com.example.backend.config.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/assessments")
@RequiredArgsConstructor
public class AssessmentController {

    private final AssessmentService assessmentService;
    private final CurrentUserProvider currentUserProvider;

    @PostMapping("/submit")
    public ResponseEntity<AssessmentScoreResponseDto> submitAssessment(
            @RequestBody SubmitAssessmentRequestDto request,
            Authentication authentication) {

        UUID userId = currentUserProvider.getCurrentUserId(authentication);
        return ResponseEntity.ok(assessmentService.submitAssessment(userId, request));
    }
}
