package com.example.backend.admin.controller;

import com.example.backend.admin.dto.AdminResumeDto;
import com.example.backend.admin.service.AdminResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/resumes")
@RequiredArgsConstructor
public class AdminResumeController {

    private final AdminResumeService adminResumeService;

    @GetMapping
    public ResponseEntity<List<AdminResumeDto>> getAllResumes() {
        return ResponseEntity.ok(adminResumeService.getAllResumes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminResumeDto> getResumeById(@PathVariable UUID id) {
        return ResponseEntity.ok(adminResumeService.getResumeById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteResume(@PathVariable UUID id) {
        adminResumeService.deleteResume(id);
        return ResponseEntity.ok(Map.of("message", "ลบเรซูเม่และข้อมูลที่เกี่ยวข้องเรียบร้อยแล้ว"));
    }
}