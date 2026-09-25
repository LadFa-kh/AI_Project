package com.example.backend.company.service;

import com.example.backend.company.entity.JobDescriptionEntity;
import com.example.backend.company.repository.JobDescriptionRepository;
import com.example.backend.finalscore.entity.FinalScoreEntity;
import com.example.backend.finalscore.repository.FinalScoreRepository;
import com.example.backend.company.dto.JobMatchResponseDto;
import com.example.backend.handle.BusinessException;
import com.example.backend.resume.entity.ResumeSkillEntity;
import com.example.backend.resume.repository.ResumeSkillRepository;
import com.example.backend.resume.service.SemanticSkillMatcher;
import com.example.backend.resume.service.SkillMatchResult;
import com.example.backend.usage.TokenMeter;
import com.example.backend.usage.UsageService;
import com.example.backend.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * จับคู่เรซูเม่กับประกาศงานที่เปิดรับ
 *
 * ทักษะที่ประกาศต้องการ 1 ตัวนับว่า "มี" ถ้าตรงอย่างใดอย่างหนึ่ง:
 *   1) ตรงด้วยคำ (เหมือนเดิม) เช่น "React" กับ "React"
 *   2) AI ตัดสินว่าความหมายตรงกัน (B2 semantic matching) เช่น "ReactJS" กับ "React"
 * ข้อ 2 เรียก LLM ครั้งเดียวต่อคำขอ โดยรวมทักษะของทุกประกาศเป็นชุดเดียว
 * ผลเก็บลง skill_match_cache ครั้งต่อไปไม่ต้องเรียก LLM ซ้ำ
 * ถ้า AI ใช้ไม่ได้ จะถอยกลับไปจับคู่ด้วยคำอย่างเดียว (ไม่ error)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MatchingService {

    public static final String JOB_MATCHING = "JOB_MATCHING";

    private final JobDescriptionRepository jobDescriptionRepository;
    private final ResumeSkillRepository resumeSkillRepository;
    private final FinalScoreRepository finalScoreRepository;
    private final SemanticSkillMatcher semanticSkillMatcher;
    private final UsageService usageService;
    private final UserRepository userRepository;

    public List<JobMatchResponseDto> getMatchedJobs(UUID userId, UUID resumeId) {
        FinalScoreEntity finalScoreEntity = finalScoreRepository.findByUserIdAndResumeId(userId, resumeId)
                .orElseThrow(() -> BusinessException.notFound("ASSESSMENT_NOT_FOUND",
                        "ยังไม่มีผลประเมินของเรซูเม่นี้ — ทำแบบประเมินให้เสร็จก่อนถึงจะจับคู่ที่ฝึกงานได้"
                ));
        BigDecimal userFinalScore = finalScoreEntity.getFinalScore();

        List<String> rawUserSkills = resumeSkillRepository.findByResumeEntityId(resumeId)
                .stream()
                .map(ResumeSkillEntity::getSkillName)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        List<String> userSkills = rawUserSkills.stream()
                .map(this::normalize)   // [FIX] normalize เหมือน SkillTaxonomyService
                .collect(Collectors.toList());

        List<JobDescriptionEntity> allJobs = jobDescriptionRepository.findAll().stream()
                .filter(JobDescriptionService::isOpen)   // B3: ไม่จับคู่กับประกาศที่ปิด/ร่าง
                .toList();

        // ทักษะที่ AI บอกว่าเรซูเม่นี้ "มี" (รวมทุกประกาศ เรียก AI ครั้งเดียว)
        Set<String> aiCovered = semanticCoverage(userId, rawUserSkills, allJobs);

        record ScoredMatch(JobMatchResponseDto dto, double matchPercentage) {}

        List<ScoredMatch> scored = new ArrayList<>();

        for (JobDescriptionEntity job : allJobs) {
            List<String> requiredSkills = parseRequiredSkills(job.getRequiredSkills());
            if (requiredSkills.isEmpty()) continue;

            List<String> matchedSkills = new ArrayList<>();
            List<String> missingSkills = new ArrayList<>();
            List<String> aiMatchedSkills = new ArrayList<>();

            for (String reqSkill : requiredSkills) {
                String normalizedReqSkill = normalize(reqSkill);
                boolean wordMatched = userSkills.stream()
                        .anyMatch(userSkill -> isWordBoundaryMatch(normalizedReqSkill, userSkill)
                                || isWordBoundaryMatch(userSkill, normalizedReqSkill));

                if (wordMatched) {
                    matchedSkills.add(reqSkill);
                } else if (aiCovered.contains(normalizedReqSkill)) {
                    matchedSkills.add(reqSkill);
                    aiMatchedSkills.add(reqSkill);
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
                    .aiMatchedSkills(aiMatchedSkills.isEmpty() ? null : aiMatchedSkills)
                    .build();

            scored.add(new ScoredMatch(dto, matchPercentage));
        }

        return scored.stream()
                .sorted(Comparator.comparingDouble(ScoredMatch::matchPercentage).reversed())
                .map(ScoredMatch::dto)
                .limit(5)
                .collect(Collectors.toList());
    }

    /**
     * รวมทักษะของทุกประกาศเป็นชุดเดียว แล้วให้ SemanticSkillMatcher ตัดสิน (คำตรงกันก่อน → cache → LLM)
     * คืนชุดทักษะของประกาศ (normalize แล้ว) ที่เรซูเม่นี้ครอบคลุม
     * บันทึก usage_logs เป็น action JOB_MATCHING (ไม่หักเครดิต) เพื่อให้เห็นต้นทุนใน Cost per action
     */
    private Set<String> semanticCoverage(UUID userId, List<String> rawUserSkills, List<JobDescriptionEntity> jobs) {
        List<String> union = jobs.stream()
                .flatMap(j -> parseRequiredSkills(j.getRequiredSkills()).stream())
                .filter(s -> !s.isEmpty())
                .distinct()
                .toList();
        if (rawUserSkills.isEmpty() || union.isEmpty()) return Set.of();

        TokenMeter outer = TokenMeter.current();
        TokenMeter meter = outer != null ? outer : TokenMeter.start();
        long t0 = System.currentTimeMillis();
        Set<String> covered = new HashSet<>();
        String method = "WORD_ONLY";
        try {
            SkillMatchResult r = semanticSkillMatcher.match(rawUserSkills, union, true);
            method = r.getMatchMethod();
            if (r.getMatchDetails() != null) {
                r.getMatchDetails().stream()
                        .filter(d -> "SEMANTIC".equals(d.getMethod()) && d.getStandardSkill() != null)
                        .forEach(d -> covered.add(normalize(d.getStandardSkill())));
            }
        } catch (Exception e) {
            log.warn("[job-matching] semantic skipped: {}", e.getMessage());
            method = "WORD_FALLBACK";
        } finally {
            if (outer == null) TokenMeter.clear();
        }
        if (outer == null) {
            final String usedMethod = method;
            try {
                userRepository.findById(userId).ifPresent(u -> usageService.log(u, JOB_MATCHING, true, 0,
                        System.currentTimeMillis() - t0, "jobs=" + jobs.size() + " method=" + usedMethod, meter));
            } catch (Exception e) {
                log.debug("[job-matching] usage log skipped: {}", e.getMessage());
            }
        }
        return covered;
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