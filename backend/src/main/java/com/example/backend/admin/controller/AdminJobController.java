package com.example.backend.admin.controller;

import com.example.backend.company.dto.JobDescriptionResponseDto;
import com.example.backend.company.dto.JobPostRequestDto;
import com.example.backend.company.service.JobDescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/jobs")
@RequiredArgsConstructor
public class AdminJobController {

    private final JobDescriptionService jobDescriptionService;

    @GetMapping
    public ResponseEntity<List<JobDescriptionResponseDto>> getAllJobs() {
        return ResponseEntity.ok(jobDescriptionService.getAllJobDescriptions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobDescriptionResponseDto> getJobById(@PathVariable UUID id) {
        return ResponseEntity.ok(jobDescriptionService.getJobDescriptionById(id));
    }

    @PostMapping
    public ResponseEntity<JobDescriptionResponseDto> createJob(@RequestBody JobPostRequestDto request) {
        return ResponseEntity.ok(jobDescriptionService.createJobDescription(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobDescriptionResponseDto> updateJob(@PathVariable UUID id,
                                                               @RequestBody JobPostRequestDto request) {
        return ResponseEntity.ok(jobDescriptionService.updateJobDescription(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteJob(@PathVariable UUID id) {
        jobDescriptionService.deleteJobDescription(id);
        return ResponseEntity.ok(Map.of("message", "ลบประกาศงานเรียบร้อยแล้ว"));
    }
}