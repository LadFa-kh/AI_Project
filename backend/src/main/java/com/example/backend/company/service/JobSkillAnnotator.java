package com.example.backend.company.service;

import com.example.backend.company.dto.JobDescriptionResponseDto;
import com.example.backend.resume.entity.ResumeSkillEntity;
import com.example.backend.resume.repository.ResumeRepository;
import com.example.backend.resume.repository.ResumeSkillRepository;
import com.example.backend.resume.service.SkillTaxonomyService;
import com.example.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * เติม requiredSkillsDetail ให้การ์ดงาน: ทักษะไหนที่ผู้ใช้มีแล้ว (isMatch=true) ไหนยังขาด
 * ใช้การจับคู่ด้วยคำ (กติกาเดียวกับการให้คะแนน) ไม่เรียก AI เพื่อให้หน้ารายการงานโหลดเร็ว
 */
@Service
@RequiredArgsConstructor
public class JobSkillAnnotator {

    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final ResumeSkillRepository resumeSkillRepository;
    private final SkillTaxonomyService taxonomy;

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
        if (job == null || userSkills == null || job.getRequiredSkills() == null) return;
        List<Map<String, Object>> detail = new ArrayList<>();
        for (String s : job.getRequiredSkills()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("skillName", s);
            m.put("isMatch", taxonomy.findWordMatch(s, userSkills) != null);
            detail.add(m);
        }
        job.setRequiredSkillsDetail(detail);
    }

    public void annotateAll(Collection<JobDescriptionResponseDto> jobs, Authentication auth) {
        List<String> skills = userSkills(auth);
        if (skills == null) return;
        jobs.forEach(j -> annotate(j, skills));
    }
}
