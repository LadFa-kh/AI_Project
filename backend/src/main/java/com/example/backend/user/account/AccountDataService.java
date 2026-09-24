package com.example.backend.user.account;

import com.example.backend.admin.service.AdminResumeService;
import com.example.backend.assessment.repository.AssessmentAnswerRepository;
import com.example.backend.company.repository.JobDescriptionRepository;
import com.example.backend.desiredRole.repository.DesiredRoleRepository;
import com.example.backend.finalscore.repository.FinalScoreRepository;
import com.example.backend.handle.BusinessException;
import com.example.backend.handle.repository.RefreshTokenRepository;
import com.example.backend.internship.InternshipRecordRepository;
import com.example.backend.resume.entity.ResumeEntity;
import com.example.backend.resume.repository.ResumeRepository;
import com.example.backend.resume.repository.ResumeSkillRepository;
import com.example.backend.usage.UsageLogRepository;
import com.example.backend.user.consent.ConsentService;
import com.example.backend.user.consent.UserConsentRepository;
import com.example.backend.user.entity.UserEntity;
import com.example.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.*;

/**
 * B9 (PDPA): สิทธิ์ขอสำเนาข้อมูล (data export) และสิทธิ์ขอลบข้อมูล (DELETE /users/me)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccountDataService {

    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final ResumeSkillRepository resumeSkillRepository;
    private final FinalScoreRepository finalScoreRepository;
    private final AssessmentAnswerRepository answerRepository;
    private final DesiredRoleRepository desiredRoleRepository;
    private final AdminResumeService adminResumeService;
    private final JobDescriptionRepository jobRepository;
    private final InternshipRecordRepository internshipRepository;
    private final UserConsentRepository consentRepository;
    private final UsageLogRepository usageLogRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final ConsentService consentService;
    private final PasswordEncoder passwordEncoder;

    /** สำเนาข้อมูลทั้งหมดของผู้ใช้เป็น JSON (ไม่รวมรหัสผ่าน) */
    @Transactional(readOnly = true)
    public Map<String, Object> export(UserEntity u) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("exportedAt", Instant.now());

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id", u.getId());
        profile.put("email", u.getEmail());
        profile.put("fullName", u.getFullName());
        profile.put("telephone", u.getTelephone());
        profile.put("role", u.getRole() == null ? null : u.getRole().name());
        profile.put("authProvider", u.getAuthProvider() == null ? null : u.getAuthProvider().name());
        profile.put("accountStatus", u.effectiveStatus().name());
        profile.put("createdAt", u.getCreatedAt());
        profile.put("companyId", u.getCompany() == null ? null : u.getCompany().getId());
        out.put("profile", profile);

        List<Map<String, Object>> resumes = new ArrayList<>();
        for (ResumeEntity r : resumesOf(u)) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("originalFilename", r.getOriginalFilename());
            m.put("uploadedAt", r.getUploadedAt());
            m.put("skills", resumeSkillRepository.findByResumeEntityId(r.getId()).stream()
                    .map(s -> Map.of("name", String.valueOf(s.getSkillName()), "type", String.valueOf(s.getSkillType()))).toList());
            finalScoreRepository.findByUserIdAndResumeId(u.getId(), r.getId()).ifPresent(f -> {
                m.put("resumeScore", f.getResumeScore());
                m.put("assessmentScore", f.getAssessmentScore());
                m.put("finalScore", f.getFinalScore());
            });
            resumes.add(m);
        }
        out.put("resumes", resumes);
        out.put("desiredRoles", desiredRoleRepository.findAll().stream()
                .filter(d -> d.getUser() != null && d.getUser().getId().equals(u.getId()))
                .map(d -> Map.of("roleName", String.valueOf(d.getRoleName()), "createdAt", String.valueOf(d.getCreatedAt()))).toList());
        out.put("internships", internshipRepository.findByStudent_IdOrderByCreatedAtDesc(u.getId()).stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("company", r.getCompany() != null ? r.getCompany().getNameTh() : r.getCompanyNameText());
            m.put("positionName", r.getPositionName());
            m.put("startDate", r.getStartDate());
            m.put("endDate", r.getEndDate());
            m.put("status", r.getStatus().name());
            return m;
        }).toList());
        out.put("consents", consentService.history(u));
        out.put("usage", usageLogRepository.findByUser_Id(u.getId()).stream().map(l -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("action", l.getAction());
            m.put("success", l.isSuccess());
            m.put("creditsUsed", l.getCreditsUsed());
            m.put("createdAt", l.getCreatedAt());
            return m;
        }).toList());
        return out;
    }

    /**
     * ลบบัญชีถาวร
     *   บัญชีปกติ: ต้องส่ง password มายืนยัน / บัญชี Google: ส่ง confirm = อีเมลตัวเอง
     *   ลบ: เรซูเม่+ไฟล์+คะแนน+คำตอบ, ประวัติฝึกงาน, consent, refresh token
     *   เก็บแบบนิรนาม: usage log (สถิติ) / ประกาศงานของผู้ประกาศยังอยู่ แต่ไม่ผูกกับบัญชีแล้ว
     */
    @Transactional
    public void deleteAccount(UserEntity u, String password, String confirm) {
        if (u.getRole() == UserEntity.Role.ADMIN) {
            throw BusinessException.forbidden("ADMIN_SELF_DELETE", "ผู้ดูแลระบบลบบัญชีตัวเองผ่านช่องทางนี้ไม่ได้");
        }
        boolean ok = u.getPasswordHash() != null
                ? password != null && passwordEncoder.matches(password, u.getPasswordHash())
                : confirm != null && confirm.trim().equalsIgnoreCase(u.getEmail());
        if (!ok) {
            throw BusinessException.badRequest("CONFIRMATION_FAILED",
                    u.getPasswordHash() != null ? "รหัสผ่านไม่ถูกต้อง" : "กรุณาพิมพ์อีเมลของคุณในช่อง confirm เพื่อยืนยัน");
        }
        UUID id = u.getId();

        for (ResumeEntity r : resumesOf(u)) {
            String path = r.getFilePath();
            adminResumeService.deleteResume(r.getId());
            deleteFileQuietly(path);
        }
        answerRepository.deleteAll(answerRepository.findAll().stream()
                .filter(a -> a.getUser() != null && a.getUser().getId().equals(id)).toList());
        desiredRoleRepository.deleteAll(desiredRoleRepository.findAll().stream()
                .filter(d -> d.getUser() != null && d.getUser().getId().equals(id)).toList());
        internshipRepository.deleteByStudent_Id(id);
        consentRepository.deleteByUser_Id(id);
        usageLogRepository.anonymizeUser(id);
        refreshTokenRepository.deleteByUser(u);
        jobRepository.findByEmployer_Id(id).forEach(j -> { j.setEmployer(null); jobRepository.save(j); });

        userRepository.delete(u);
        log.info("[pdpa] account {} deleted by owner", id);
    }

    private List<ResumeEntity> resumesOf(UserEntity u) {
        return resumeRepository.findAll().stream()
                .filter(r -> r.getUserEntity() != null && r.getUserEntity().getId().equals(u.getId()))
                .toList();
    }

    private void deleteFileQuietly(String path) {
        if (path == null || path.isBlank()) return;
        try { Files.deleteIfExists(Path.of(path)); }
        catch (Exception e) { log.warn("[pdpa] could not delete file {}: {}", path, e.getMessage()); }
    }
}
