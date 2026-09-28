package com.example.backend.assessment.service;

import com.example.backend.assessment.dto.AssessmentScoreResponseDto;
import com.example.backend.assessment.entity.AssessmentResultEntity;
import com.example.backend.assessment.repository.AssessmentResultRepository;
import com.example.backend.desiredRole.repository.DesiredRoleRepository;
import com.example.backend.finalscore.entity.FinalScoreEntity;
import com.example.backend.finalscore.repository.FinalScoreRepository;
import com.example.backend.handle.BusinessException;
import com.example.backend.resume.entity.ResumeEntity;
import com.example.backend.resume.repository.ResumeGapAnalysisRepository;
import com.example.backend.resume.repository.ResumeRepository;
import com.example.backend.user.entity.UserEntity;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * ผลการประเมินย้อนหลัง
 *  - รอบที่ส่งหลังอัปเดตนี้: คืน JSON ฉบับเต็มเหมือนตอน submit ทุกประการ (+ submittedAt)
 *  - รอบเก่า: ประกอบจาก final_score + resume_gap_analysis ได้เฉพาะคะแนน / ทักษะที่ขาด / สรุปคำแนะนำ
 *    และติดธง "partial": true ให้หน้าบ้านรู้ว่าไม่มี scoreBreakdown / careerMatches
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AssessmentHistoryService {

    private final AssessmentResultRepository resultRepository;
    private final FinalScoreRepository finalScoreRepository;
    private final ResumeRepository resumeRepository;
    private final ResumeGapAnalysisRepository gapRepository;
    private final DesiredRoleRepository desiredRoleRepository;
    private final ObjectMapper objectMapper;

    /** เรียกตอน submit สำเร็จ — ล้มเหลวก็ไม่ทำให้ submit ล้ม */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void save(UserEntity user, ResumeEntity resume, AssessmentScoreResponseDto dto, String roleUsed) {
        try {
            AssessmentResultEntity e = resultRepository.findByResume_Id(resume.getId()).orElseGet(AssessmentResultEntity::new);
            e.setUser(user);
            e.setResume(resume);
            e.setFinalScore(dto.getFinalScore());
            e.setRoleUsed(roleUsed);
            e.setResultJson(objectMapper.writeValueAsString(dto));
            e.setCreatedAt(Instant.now());
            resultRepository.save(e);
        } catch (Exception ex) {
            log.warn("[assessment-history] save failed for resume {}: {}", resume.getId(), ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listMine(UserEntity user) {
        Map<UUID, Map<String, Object>> byResume = new LinkedHashMap<>();
        for (AssessmentResultEntity r : resultRepository.findByUser_Id(user.getId())) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("resumeId", r.getResume().getId());
            m.put("originalFilename", r.getResume().getOriginalFilename());
            m.put("finalScore", r.getFinalScore());
            m.put("roleUsedForMatching", r.getRoleUsed());
            m.put("submittedAt", r.getCreatedAt());
            m.put("partial", false);
            byResume.put(r.getResume().getId(), m);
        }
        // รอบเก่าที่ยังไม่มี JSON ฉบับเต็ม
        for (ResumeEntity res : myResumes(user)) {
            if (byResume.containsKey(res.getId())) continue;
            finalScoreRepository.findByResume_Id(res.getId()).ifPresent(fs -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("resumeId", res.getId());
                m.put("originalFilename", res.getOriginalFilename());
                m.put("finalScore", fs.getFinalScore());
                m.put("roleUsedForMatching", roleOf(res.getId()));
                m.put("submittedAt", submittedAtOf(res));
                m.put("partial", true);
                byResume.put(res.getId(), m);
            });
        }
        List<Map<String, Object>> out = new ArrayList<>(byResume.values());
        out.sort(Comparator.comparing((Map<String, Object> m) -> (Instant) m.get("submittedAt"),
                Comparator.nullsLast(Comparator.reverseOrder())));
        return out;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> latest(UserEntity user) {
        List<Map<String, Object>> all = listMine(user);
        if (all.isEmpty()) {
            throw BusinessException.notFound("NO_ASSESSMENT", "ยังไม่มีผลการประเมิน กรุณาทำแบบประเมินทักษะก่อน");
        }
        return byResume(user, (UUID) all.get(0).get("resumeId"));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> byResume(UserEntity user, UUID resumeId) {
        ResumeEntity resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> BusinessException.notFound("NO_ASSESSMENT", "ไม่พบผลการประเมินของเรซูเม่นี้"));
        boolean admin = user.getRole() == UserEntity.Role.ADMIN;
        if (!admin && !resume.getUserEntity().getId().equals(user.getId())) {
            throw BusinessException.notFound("NO_ASSESSMENT", "ไม่พบผลการประเมินของเรซูเม่นี้");
        }
        Optional<AssessmentResultEntity> full = resultRepository.findByResume_Id(resumeId);
        if (full.isPresent()) {
            try {
                Map<String, Object> m = objectMapper.readValue(full.get().getResultJson(), new TypeReference<LinkedHashMap<String, Object>>() {});
                m.put("submittedAt", full.get().getCreatedAt());
                m.put("partial", false);
                return m;
            } catch (Exception ex) {
                log.warn("[assessment-history] bad json for resume {}: {}", resumeId, ex.getMessage());
            }
        }
        FinalScoreEntity fs = finalScoreRepository.findByResume_Id(resumeId)
                .orElseThrow(() -> BusinessException.notFound("NO_ASSESSMENT", "เรซูเม่นี้ยังไม่ได้ทำแบบประเมิน"));
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("resumeId", resumeId);
        m.put("resumeScore", fs.getResumeScore());
        m.put("assessmentScore", fs.getAssessmentScore());
        m.put("finalScore", fs.getFinalScore());
        gapRepository.findByResume_Id(resumeId).ifPresent(g -> {
            m.put("missingSkills", g.getMissingSkills() == null || g.getMissingSkills().isBlank() ? List.of()
                    : Arrays.stream(g.getMissingSkills().split("\\s*\\|\\s*")).filter(s -> !s.isBlank()).toList());
            m.put("recommendationSummary", g.getRecommendation());
        });
        m.put("recommendationItems", List.of());
        m.put("roleUsedForMatching", roleOf(resumeId));
        m.put("submittedAt", submittedAtOf(resume));
        m.put("partial", true);
        return m;
    }

    private List<ResumeEntity> myResumes(UserEntity user) {
        return resumeRepository.findAll().stream()
                .filter(r -> r.getUserEntity() != null && r.getUserEntity().getId().equals(user.getId()))
                .toList();
    }

    private String roleOf(UUID resumeId) {
        return desiredRoleRepository.findAll().stream()
                .filter(d -> d.getResume() != null && d.getResume().getId().equals(resumeId))
                .map(d -> d.getRoleName()).findFirst().orElse(null);
    }

    private Instant submittedAtOf(ResumeEntity r) {
        return gapRepository.findByResume_Id(r.getId()).map(g -> g.getCreatedAt()).orElse(r.getUploadedAt());
    }
}
