package com.example.backend.company.controller;
import com.example.backend.company.dto.JobMatchResponseDto;
import com.example.backend.company.service.MatchingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/matching")
@RequiredArgsConstructor
public class MatchingController {

    private final MatchingService matchingService;

    @GetMapping("/recommendations")
    public ResponseEntity<List<JobMatchResponseDto>> getRecommendations(
            @RequestParam("userId") UUID userId,
            @RequestParam("resumeId") UUID resumeId) {
        try {
            List<JobMatchResponseDto> recommendations = matchingService.getMatchedJobs(userId, resumeId);
            return ResponseEntity.ok(recommendations);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}