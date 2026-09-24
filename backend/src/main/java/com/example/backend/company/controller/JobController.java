package com.example.backend.company.controller;

import com.example.backend.company.dto.JobDescriptionResponseDto;
import com.example.backend.company.dto.JobPostRequestDto;
import com.example.backend.company.dto.JobStatusUpdateDto;
import com.example.backend.company.service.JobDescriptionService;
import com.example.backend.config.CurrentUserProvider;
import com.example.backend.handle.ApiResponse;
import com.example.backend.handle.BusinessException;
import com.example.backend.user.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobDescriptionService jobDescriptionService;
    private final CurrentUserProvider currentUserProvider;

    /**
     * B4: ผู้ลงประกาศและบริษัทมาจากโทเคนเสมอ (ไม่เชื่อ employerId ใน body แล้ว — ปิดช่องโหว่เดิม)
     * ADMIN ยังส่ง employerId เพื่อลงแทนคนอื่นได้
     */
    @PostMapping
    public ResponseEntity<JobDescriptionResponseDto> postJob(Authentication auth, @RequestBody JobPostRequestDto request) {
        UserEntity me = currentUserProvider.getCurrentUser(auth);
        if (me.getRole() == UserEntity.Role.STUDENT) {
            throw BusinessException.forbidden("NOT_EMPLOYER", "เฉพาะผู้ประกาศงานหรือผู้ดูแลระบบเท่านั้น");
        }
        if (me.getRole() != UserEntity.Role.ADMIN || request.getEmployerId() == null) {
            request.setEmployerId(me.getId());
        }
        return ResponseEntity.ok(jobDescriptionService.createJobDescription(request));
    }

    /** B3: เปลี่ยนสถานะ/วันเปิด-ปิด body: {"status":"OPEN|CLOSED|DRAFT","openDate":"2026-10-01","closeDate":"2026-11-30"} */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<JobDescriptionResponseDto>> updateStatus(Authentication auth, @PathVariable UUID id,
                                                                               @RequestBody JobStatusUpdateDto body) {
        UserEntity me = currentUserProvider.getCurrentUser(auth);
        return ResponseEntity.ok(new ApiResponse<>(200, "อัปเดตสถานะแล้ว",
                jobDescriptionService.updateStatus(me, id, body.getStatus(), body.getOpenDate(), body.getCloseDate())));
    }
}
