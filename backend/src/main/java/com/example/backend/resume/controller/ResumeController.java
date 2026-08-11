package com.example.backend.resume.controller;

import com.example.backend.resume.dto.ResumeUploadResponseDto;
import com.example.backend.resume.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/resumes")
@RequiredArgsConstructor
@CrossOrigin("*")
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResumeUploadResponseDto> uploadResume(
            @RequestParam("userId") UUID userId,
            @RequestParam("file") MultipartFile file) {
        try {
            ResumeUploadResponseDto response = resumeService.processAndSaveResume(userId, file);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}