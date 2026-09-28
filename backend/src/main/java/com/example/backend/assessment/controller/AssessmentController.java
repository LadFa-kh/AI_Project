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
    private final com.example.backend.assessment.service.AssessmentHistoryService assessmentHistoryService;
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

    // ===== ผลการประเมินย้อนหลัง =====

    /** ผลล่าสุดของผู้ใช้ — รูปแบบเดียวกับ response ของ submit (+ submittedAt, partial) */
    @GetMapping("/me/latest")
    public ResponseEntity<com.example.backend.handle.ApiResponse<java.util.Map<String, Object>>> myLatest(Authentication authentication) {
        var user = currentUserProvider.getCurrentUser(authentication);
        return ResponseEntity.ok(new com.example.backend.handle.ApiResponse<>(200, "OK", assessmentHistoryService.latest(user)));
    }

    /** ประวัติการประเมินทุกรอบ (ย่อ) เรียงล่าสุดก่อน */
    @GetMapping("/me")
    public ResponseEntity<com.example.backend.handle.ApiResponse<java.util.List<java.util.Map<String, Object>>>> myHistory(Authentication authentication) {
        var user = currentUserProvider.getCurrentUser(authentication);
        return ResponseEntity.ok(new com.example.backend.handle.ApiResponse<>(200, "OK", assessmentHistoryService.listMine(user)));
    }

    /** ผลของเรซูเม่ที่ระบุ (เจ้าของ หรือ ADMIN) */
    @GetMapping("/me/{resumeId}")
    public ResponseEntity<com.example.backend.handle.ApiResponse<java.util.Map<String, Object>>> myByResume(Authentication authentication,
                                                                                                          @PathVariable UUID resumeId) {
        var user = currentUserProvider.getCurrentUser(authentication);
        return ResponseEntity.ok(new com.example.backend.handle.ApiResponse<>(200, "OK", assessmentHistoryService.byResume(user, resumeId)));
    }
}
