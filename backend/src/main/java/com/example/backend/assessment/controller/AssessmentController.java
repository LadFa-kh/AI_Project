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
    private final com.example.backend.usage.UsageService usageService;
    private final com.example.backend.platform.AsyncTaskService asyncTaskService;

    /**
     * B10: ส่ง ?async=true เพื่อรับ 202 + taskId ทันที แล้ว poll GET /api/v1/tasks/{taskId}
     * ไม่ส่ง = ทำงานแบบเดิม (รอจนเสร็จ) หน้าบ้านเดิมใช้ได้เหมือนเดิม
     */
    @PostMapping(value = "/submit", params = "async=true")
    public ResponseEntity<com.example.backend.handle.ApiResponse<java.util.Map<String, Object>>> submitAssessmentAsync(
            @RequestBody SubmitAssessmentRequestDto request,
            Authentication authentication) {
        var user = currentUserProvider.getCurrentUser(authentication);
        var taskId = asyncTaskService.submit(user, "ASSESSMENT_SUBMIT", () -> usageService.run(user,
                com.example.backend.usage.UsageService.ASSESSMENT_SUBMIT,
                () -> assessmentService.submitAssessment(user.getId(), request)));
        return ResponseEntity.accepted().body(new com.example.backend.handle.ApiResponse<>(202, "รับงานแล้ว กำลังประมวลผล",
                java.util.Map.of("taskId", taskId, "statusUrl", "/api/v1/tasks/" + taskId)));
    }

    @PostMapping("/submit")
    public ResponseEntity<AssessmentScoreResponseDto> submitAssessment(
            @RequestBody SubmitAssessmentRequestDto request,
            Authentication authentication) {

        var user = currentUserProvider.getCurrentUser(authentication);
        // B8: ตรวจ/หักเครดิต — หักเฉพาะตอนสำเร็จ
        return ResponseEntity.ok(usageService.run(user, com.example.backend.usage.UsageService.ASSESSMENT_SUBMIT,
                () -> assessmentService.submitAssessment(user.getId(), request)));
    }
}
