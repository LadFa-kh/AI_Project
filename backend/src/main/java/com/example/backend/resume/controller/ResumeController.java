package com.example.backend.resume.controller;

import com.example.backend.resume.python.ResumeUploadResponseDto;
import com.example.backend.resume.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping("/upload")
    public ResponseEntity<ResumeUploadResponseDto> uploadResume(
            @RequestParam("userId") UUID userId,
            @RequestParam("file") MultipartFile file) {
        try {
            ResumeUploadResponseDto response = resumeService.processAndSaveResume(userId, file);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}