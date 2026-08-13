package com.example.backend.resume.service;

import com.example.backend.resume.repository.SoftwareSkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class SkillTaxonomyService {

    private final SoftwareSkillRepository softwareSkillRepository;

    private static final Set<String> STOP_WORDS = Set.of(
            "and", "or", "for", "with", "the", "in", "of", "a", "an", "senior", "junior", "lead"
    );

    public List<String> extractAndAggregateStandardSkills(String desiredRoleName) {
        if (desiredRoleName == null || desiredRoleName.isBlank()) {
            return Collections.emptyList();
        }

        String[] tokens = desiredRoleName.split("[,/\\-_&()\\s]+");
        Set<String> aggregatedSkillsSet = new HashSet<>();

        for (String token : tokens) {
            String cleanedToken = token.trim().toLowerCase();
            if (cleanedToken.length() >= 3 && !STOP_WORDS.contains(cleanedToken)) {
                List<String> skillsFromDb = softwareSkillRepository.findSkillNamesByTitleQuery(cleanedToken);
                if (skillsFromDb != null && !skillsFromDb.isEmpty()) {
                    aggregatedSkillsSet.addAll(skillsFromDb);
                }
            }
        }

        return new ArrayList<>(aggregatedSkillsSet);
    }

    private String normalize(String skillName) {
        return skillName
                .replaceAll("\\(.*?\\)", "")
                .replaceAll("[^a-zA-Z0-9\\s.#+]", "")
                .trim()
                .toLowerCase();
    }

    /**
     * [FIX] เปลี่ยนจาก substring matching แบบดิบ เป็น word-boundary matching
     * กันปัญหาคำสั้นๆ (เช่น "R", "Go", "C") ไปแมตช์มั่วกับคำอื่นที่บังเอิญมีตัวอักษรซ้อนกันอยู่ (เช่น "Docker" มี "r" อยู่ข้างใน)
     */
    private boolean isWordBoundaryMatch(String shorter, String longer) {
        if (shorter.isEmpty()) return false;
        String pattern = "\\b" + Pattern.quote(shorter) + "\\b";
        return Pattern.compile(pattern).matcher(longer).find();
    }

    public BigDecimal calculateOnetSkillMatchScore(List<String> extractedSkills, List<String> standardSkills) {
        if (standardSkills == null || standardSkills.isEmpty() || extractedSkills == null || extractedSkills.isEmpty()) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        long matchedCount = 0;
        for (String userSkill : extractedSkills) {
            String userLower = normalize(userSkill);
            if (userLower.length() < 2) continue;

            for (String stdSkill : standardSkills) {
                String stdLower = normalize(stdSkill);
                if (stdLower.length() < 2) continue; // [FIX] เพิ่มเช็คความยาวฝั่ง standard skill ด้วย

                if (isWordBoundaryMatch(userLower, stdLower) || isWordBoundaryMatch(stdLower, userLower)) {
                    matchedCount++;
                    break;
                }
            }
        }

        double precisionScore = ((double) matchedCount / extractedSkills.size()) * 100.0;

        double penaltyFactor = 1.0;
        if (matchedCount == 0) {
            penaltyFactor = 0.0;
        } else if (matchedCount == 1) {
            penaltyFactor = 0.3;
        } else if (matchedCount == 2) {
            penaltyFactor = 0.6;
        }

        double adjustedScore = precisionScore * penaltyFactor;
        double finalScore = Math.min(100.0, adjustedScore);

        return BigDecimal.valueOf(finalScore).setScale(2, RoundingMode.HALF_UP);
    }
}