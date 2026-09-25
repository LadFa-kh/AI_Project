package com.example.backend.company.service;

import com.example.backend.company.dto.JobDescriptionResponseDto;
import com.example.backend.resume.entity.ResumeSkillEntity;
import com.example.backend.resume.repository.ResumeRepository;
import com.example.backend.resume.repository.ResumeSkillRepository;
import com.example.backend.resume.service.SemanticSkillMatcher;
import com.example.backend.resume.service.SkillMatchResult;
import com.example.backend.resume.service.SkillTaxonomyService;
import com.example.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * เติม requiredSkillsDetail ให้การ์ดงาน: ทักษะไหนที่ผู้ใช้มีแล้ว (isMatch=true) ไหนยังขาด
 * ตรงด้วยคำก่อน แล้วค่อยดูผลที่ AI เคยตัดสินไว้ใน skill_match_cache (matchMethod = "WORD" / "SEMANTIC")
 * ไม่เรียก LLM ใหม่ตรงนี้ เพื่อให้หน้ารายการงานโหลดเร็ว — ผลจาก AI มาจากตอนจับคู่งาน/ทำแบบประเมิน
 */
@Service
@RequiredArgsConstructor
public class JobSkillAnnotator {

    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final ResumeSkillRepository resumeSkillRepository;
    private final SkillTaxonomyService taxonomy;
    private final SemanticSkillMatcher semanticSkillMatcher;

    @Transactional(readOnly = true)
    public List<String> userSkills(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) return null;
        return userRepository.findByEmail(auth.getName())
                .flatMap(u -> resumeRepository.findFirstByUserEntity_IdOrderByUploadedAtDesc(u.getId()))
                .map(r -> resumeSkillRepository.findByResumeEntityId(r.getId()).stream()
                        .map(ResumeSkillEntity::getSkillName).filter(Objects::nonNull).toList())
                .orElse(null);
    }

    public void annotate(JobDescriptionResponseDto job, List<String> userSkills) {
        annotate(job, userSkills, Set.of());
    }

    private void annotate(JobDescriptionResponseDto job, List<String> userSkills, Set<String> aiCovered) {
        if (job == null || userSkills == null || job.getRequiredSkills() == null) return;
        List<Map<String, Object>> detail = new ArrayList<>();
        for (String s : job.getRequiredSkills()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("skillName", s);
            boolean word = taxonomy.findWordMatch(s, userSkills) != null;
            boolean ai = !word && aiCovered.contains(taxonomy.normalize(s));
            m.put("isMatch", word || ai);
            if (word || ai) m.put("matchMethod", word ? "WORD" : "SEMANTIC");
            detail.add(m);
        }
        job.setRequiredSkillsDetail(detail);
    }

    public void annotateAll(Collection<JobDescriptionResponseDto> jobs, Authentication auth) {
        List<String> skills = userSkills(auth);
        if (skills == null) return;
        Set<String> aiCovered = cachedCoverage(skills, jobs);
        jobs.forEach(j -> annotate(j, skills, aiCovered));
    }

    /** ทักษะของประกาศที่ AI เคยตัดสินไว้ว่าเรซูเม่นี้มี (อ่านจาก cache อย่างเดียว ไม่เรียก LLM) */
    private Set<String> cachedCoverage(List<String> userSkills, Collection<JobDescriptionResponseDto> jobs) {
        List<String> union = jobs.stream()
                .filter(j -> j.getRequiredSkills() != null)
                .flatMap(j -> j.getRequiredSkills().stream())
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (union.isEmpty() || userSkills.isEmpty()) return Set.of();
        try {
            SkillMatchResult r = semanticSkillMatcher.match(userSkills, union, false);
            Set<String> out = new HashSet<>();
            if (r.getMatchDetails() != null) {
                r.getMatchDetails().stream()
                        .filter(d -> "SEMANTIC".equals(d.getMethod()) && d.getStandardSkill() != null)
                        .forEach(d -> out.add(taxonomy.normalize(d.getStandardSkill())));
            }
            return out;
        } catch (Exception e) {
            return Set.of();
        }
    }
}
