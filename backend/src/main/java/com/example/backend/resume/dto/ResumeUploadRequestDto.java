package com.example.backend.resume.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Data
public class ResumeUploadRequestDto {
    private UUID userId;
    private MultipartFile file;
    private String desiredRoleName;
}