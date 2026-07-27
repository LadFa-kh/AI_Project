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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchingService {

    private final JobDescriptionRepository jobDescriptionRepository;
    private final ResumeSkillRepository resumeSkillRepository;
    private final FinalScoreRepository finalScoreRepository;

    public List<JobMatchResponseDto> getMatchedJobs(UUID userId, UUID resumeId) {
        // 1. ดึง FinalScore สุทธิ (Resume 60% + Self-Assessment 40%) ที่คำนวณไว้แล้วใน Phase 2
        FinalScoreEntity finalScoreEntity = finalScoreRepository.findByUserIdAndResumeId(userId, resumeId)
                .orElseThrow(() -> new RuntimeException("Final score not found"));

        BigDecimal userFinalScore = finalScoreEntity.getFinalScore();

        // 2. ดึงรายการ Skills ทั้งหมดของผู้ใช้จาก DB
        List<String> userSkills = resumeSkillRepository.findByResumeEntityId(resumeId)
                .stream()
                .map(ResumeSkillEntity::getSkillName)
                .map(String::toLowerCase)
                .map(String::trim)
                .collect(Collectors.toList());

        // 3. ดึงประกาศงานทั้งหมด
        List<JobDescriptionEntity> allJobs = jobDescriptionRepository.findAll();
        List<JobMatchResponseDto> matchResults = new ArrayList<>();

        for (JobDescriptionEntity job : allJobs) {
            List<String> requiredSkills = parseRequiredSkills(job.getRequiredSkills());

            List<String> matchedSkills = new ArrayList<>();
            List<String> missingSkills = new ArrayList<>();

            // 4. เปรียบเทียบ Skill Match และเก็บ Gap Analysis (ทักษะที่ขาด)
            for (String reqSkill : requiredSkills) {
                if (userSkills.contains(reqSkill.toLowerCase().trim())) {
                    matchedSkills.add(reqSkill);
                } else {
                    missingSkills.add(reqSkill); // ทักษะที่ควรพัฒนาเพิ่ม
                }
            }

            // 5. ส่งค่า FinalScore ที่มีอยู่แล้วไปแสดงผลคู่กับ Job แนะนำตรงๆ (ไม่มีการนำไปบวกเพิ่ม)
            matchResults.add(JobMatchResponseDto.builder()
                    .jobId(job.getId())
                    .companyName(job.getCompanyName())
                    .positionName(job.getPositionName())
                    .userFinalScore(userFinalScore) // แสดง Final Score สุทธิของผู้ใช้
                    .matchedSkills(matchedSkills)
                    .missingSkills(missingSkills)
                    .build());
        }

        // 6. จัดอันดับสถานประกอบการที่ตรงที่สุด (พิจารณาจากจำนวน Skill ที่ตรงกันมากที่สุด) แล้วเลือก Top 5
        return matchResults.stream()
                .sorted(Comparator.comparingInt((JobMatchResponseDto dto) -> dto.getMatchedSkills().size()).reversed())
                .limit(5)
                .collect(Collectors.toList());
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