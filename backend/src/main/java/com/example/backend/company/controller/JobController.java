package com.example.backend.company.controller;

import com.example.backend.company.dto.JobDescriptionResponseDto;
import com.example.backend.company.dto.JobPostRequestDto;
import com.example.backend.company.service.JobDescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobDescriptionService jobDescriptionService;

    @PostMapping
    public ResponseEntity<JobDescriptionResponseDto> postJob(@RequestBody JobPostRequestDto request) {
        return ResponseEntity.ok(jobDescriptionService.createJobDescription(request));
    }
}