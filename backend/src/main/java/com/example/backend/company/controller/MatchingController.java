package com.example.backend.company.controller;
import com.example.backend.company.dto.JobMatchResponseDto;
import com.example.backend.company.service.MatchingService;
import com.example.backend.config.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/matching")
@RequiredArgsConstructor
public class MatchingController {

    private final MatchingService matchingService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping("/recommendations")
    public ResponseEntity<List<JobMatchResponseDto>> getRecommendations(
            @RequestParam("resumeId") UUID resumeId,
            Authentication authentication) {

        UUID userId = currentUserProvider.getCurrentUserId(authentication);
        return ResponseEntity.ok(matchingService.getMatchedJobs(userId, resumeId));
    }
}