package com.example.backend.resume.controller;

import com.example.backend.config.CurrentUserProvider;
import com.example.backend.resume.dto.ResumeUploadResponseDto;
import com.example.backend.resume.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;
    private final CurrentUserProvider currentUserProvider;
    private final com.example.backend.usage.UsageService usageService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResumeUploadResponseDto> uploadResume(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws Exception {

        var user = currentUserProvider.getCurrentUser(authentication);
        // B8: ตรวจ/หักเครดิต — หักเฉพาะตอนสำเร็จ
        return ResponseEntity.ok(usageService.run(user, com.example.backend.usage.UsageService.RESUME_UPLOAD, () -> {
            try {
                return resumeService.processAndSaveResume(user.getId(), file);
            } catch (RuntimeException e) {
                throw e;
            } catch (Exception e) {
                throw new RuntimeException(e.getMessage(), e); // ไปจบที่ handler 500 เหมือนเดิม
            }
        }));
    }
}