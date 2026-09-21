package com.example.backend.company.controller;

import com.example.backend.config.CurrentUserProvider;
import com.example.backend.company.dto.JobDescriptionResponseDto;
import com.example.backend.company.dto.JobPostRequestDto;
import com.example.backend.company.service.JobDescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * ส่วนต่อประสานสำหรับผู้ประกาศงาน (EMPLOYER) จัดการเฉพาะประกาศของตนเอง
 *
 * เดิมหน้าจัดการประกาศงานฝั่งผู้ใช้เรียก /api/v1/admin/jobs ซึ่ง SecurityConfig
 * เปิดให้เฉพาะบทบาท ADMIN บัญชี EMPLOYER จึงถูกปฏิเสธด้วยรหัสสถานะ 403
 * อีกทั้งเส้นทางของผู้ดูแลระบบคืนประกาศงานของทุกบริษัทโดยไม่กรองเจ้าของ
 *
 * เส้นทางชุดนี้แก้ทั้งสองเรื่อง โดยดึงรหัสผู้ประกาศจากโทเคนที่ผ่านการตรวจลายเซ็นแล้ว
 * ไม่รับจาก request body จึงปลอมเป็นผู้ประกาศรายอื่นไม่ได้
 */
@RestController
@RequestMapping("/api/v1/employer/jobs")
@RequiredArgsConstructor
public class EmployerJobController {

    private final JobDescriptionService jobDescriptionService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping
    public ResponseEntity<List<JobDescriptionResponseDto>> getMyJobs(Authentication authentication) {
        UUID employerId = currentUserProvider.getCurrentUserId(authentication);
        return ResponseEntity.ok(jobDescriptionService.getJobDescriptionsByEmployer(employerId));
    }

    @PostMapping
    public ResponseEntity<JobDescriptionResponseDto> createMyJob(@RequestBody JobPostRequestDto request,
                                                                 Authentication authentication) {
        UUID employerId = currentUserProvider.getCurrentUserId(authentication);
        return ResponseEntity.ok(jobDescriptionService.createJobDescriptionForEmployer(employerId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobDescriptionResponseDto> updateMyJob(@PathVariable UUID id,
                                                                 @RequestBody JobPostRequestDto request,
                                                                 Authentication authentication) {
        UUID employerId = currentUserProvider.getCurrentUserId(authentication);
        return ResponseEntity.ok(jobDescriptionService.updateJobDescriptionForEmployer(employerId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteMyJob(@PathVariable UUID id,
                                                           Authentication authentication) {
        UUID employerId = currentUserProvider.getCurrentUserId(authentication);
        jobDescriptionService.deleteJobDescriptionForEmployer(employerId, id);
        return ResponseEntity.ok(Map.of("message", "ลบประกาศงานเรียบร้อยแล้ว"));
    }
}
