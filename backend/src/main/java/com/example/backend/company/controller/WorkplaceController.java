package com.example.backend.company.controller;

import com.example.backend.company.dto.JobDescriptionResponseDto;
import com.example.backend.company.service.JobDescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workplaces")
@RequiredArgsConstructor
public class WorkplaceController {

    private final JobDescriptionService jobDescriptionService;

    @GetMapping
    public ResponseEntity<List<JobDescriptionResponseDto>> getAllWorkplaces() {
        return ResponseEntity.ok(jobDescriptionService.getAllJobDescriptions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobDescriptionResponseDto> getWorkplaceById(@PathVariable UUID id) {
        return ResponseEntity.ok(jobDescriptionService.getJobDescriptionById(id));
    }
}