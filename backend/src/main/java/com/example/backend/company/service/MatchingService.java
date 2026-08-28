package com.example.backend.company.service;

import com.example.backend.company.entity.JobDescriptionEntity;
import com.example.backend.company.repository.JobDescriptionRepository;
import com.example.backend.finalscore.entity.FinalScoreEntity;
import com.example.backend.finalscore.repository.FinalScoreRepository;
import com.example.backend.company.dto.JobMatchResponseDto;
import com.example.backend.resume.entity.ResumeSkillEntity;
import com.example.backend.resume.repository.ResumeSkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchingService {

    private final JobDescriptionRepository jobDescriptionRepository;
    private final ResumeSkillRepository resumeSkillRepository;
    private final FinalScoreRepository finalScoreRepository;

    public List<JobMatchResponseDto> getMatchedJobs(UUID userId, UUID resumeId) {
        FinalScoreEntity finalScoreEntity = finalScoreRepository.findByUserIdAndResumeId(userId, resumeId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "ไม่พบผลคะแนนของ resume นี้ — resume ต้องทำแบบประเมินให้เสร็จก่อนถึงจะจับคู่บริษัทได้"
                ));
        BigDecimal userFinalScore = finalScoreEntity.getFinalScore();

        List<String> userSkills = resumeSkillRepository.findByResumeEntityId(resumeId)
                .stream()
                .map(ResumeSkillEntity::getSkillName)
                .map(this::normalize)   // [FIX] normalize เหมือน SkillTaxonomyService
                .collect(Collectors.toList());

        List<JobDescriptionEntity> allJobs = jobDescriptionRepository.findAll();

        record ScoredMatch(JobMatchResponseDto dto, double matchPercentage) {}

        List<ScoredMatch> scored = new ArrayList<>();

        for (JobDescriptionEntity job : allJobs) {
            List<String> requiredSkills = parseRequiredSkills(job.getRequiredSkills());
            if (requiredSkills.isEmpty()) continue;

            List<String> matchedSkills = new ArrayList<>();
            List<String> missingSkills = new ArrayList<>();

            for (String reqSkill : requiredSkills) {
                String normalizedReqSkill = normalize(reqSkill);
                boolean isMatched = userSkills.stream()
                        .anyMatch(userSkill -> isWordBoundaryMatch(normalizedReqSkill, userSkill)
                                || isWordBoundaryMatch(userSkill, normalizedReqSkill));

                if (isMatched) {
                    matchedSkills.add(reqSkill);
                } else {
                    missingSkills.add(reqSkill);
                }
            }

            double matchPercentage = (double) matchedSkills.size() / requiredSkills.size() * 100;

            JobMatchResponseDto dto = JobMatchResponseDto.builder()
                    .jobId(job.getId())
                    .companyName(job.getCompanyName())
                    .positionName(job.getPositionName())
                    .userFinalScore(userFinalScore)
                    .matchedSkills(matchedSkills)
                    .missingSkills(missingSkills)
                    .build();

            scored.add(new ScoredMatch(dto, matchPercentage));
        }

        return scored.stream()
                .sorted(Comparator.comparingDouble(ScoredMatch::matchPercentage).reversed())
                .map(ScoredMatch::dto)
                .limit(5)
                .collect(Collectors.toList());
    }

    // [NEW] คัดลอกมาจาก SkillTaxonomyService เพื่อความสม่ำเสมอ
    private String normalize(String skillName) {
        return skillName
                .replaceAll("\\(.*?\\)", "")
                .replaceAll("[^a-zA-Z0-9\\s.#+]", "")
                .trim()
                .toLowerCase();
    }

    private boolean isWordBoundaryMatch(String shorter, String longer) {
        if (shorter.isEmpty()) return false;
        String pattern = "\\b" + Pattern.quote(shorter) + "\\b";
        return Pattern.compile(pattern).matcher(longer).find();
    }

    private List<String> parseRequiredSkills(String rawSkills) {
        if (rawSkills == null || rawSkills.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.stream(rawSkills.split(","))
                .map(String::trim)
                .collect(Collectors.toList());
    }
}