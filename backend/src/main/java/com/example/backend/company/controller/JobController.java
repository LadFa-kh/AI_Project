package com.example.backend.company.controller;

import com.example.backend.company.dto.JobPostRequestDto;
import com.example.backend.company.entity.JobDescriptionEntity;
import com.example.backend.company.service.JobDescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
@CrossOrigin("*")
public class JobController {

    private final JobDescriptionService jobDescriptionService;

    @PostMapping
    public ResponseEntity<JobDescriptionEntity> postJob(@RequestBody JobPostRequestDto request) {
        JobDescriptionEntity savedJob = jobDescriptionService.createJobDescription(request);
        return ResponseEntity.ok(savedJob);
    }
}