package com.example.backend.admin.service;

import com.example.backend.admin.dto.AdminResumeDto;
import com.example.backend.assessment.entity.AssessmentAnswerEntity;
import com.example.backend.assessment.entity.AssessmentQuestionEntity;
import com.example.backend.assessment.entity.AssessmentScoreEntity;
import com.example.backend.assessment.repository.AssessmentAnswerRepository;
import com.example.backend.assessment.repository.AssessmentQuestionRepository;
import com.example.backend.assessment.repository.AssessmentScoreRepository;
import com.example.backend.desiredRole.entity.DesiredRoleEntity;
import com.example.backend.desiredRole.repository.DesiredRoleRepository;
import com.example.backend.finalscore.entity.FinalScoreEntity;
import com.example.backend.finalscore.repository.FinalScoreRepository;
import com.example.backend.resume.entity.ResumeEntity;
import com.example.backend.resume.entity.ResumeGapAnalysisEntity;
import com.example.backend.resume.entity.ResumeScoreEntity;
import com.example.backend.resume.entity.ResumeSkillEntity;
import com.example.backend.resume.repository.ResumeGapAnalysisRepository;
import com.example.backend.resume.repository.ResumeRepository;
import com.example.backend.resume.repository.ResumeScoreRepository;
import com.example.backend.resume.repository.ResumeSkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminResumeService {

    private final ResumeRepository resumeRepository;
    private final ResumeSkillRepository resumeSkillRepository;
    private final ResumeScoreRepository resumeScoreRepository;
    private final ResumeGapAnalysisRepository resumeGapAnalysisRepository;
    private final AssessmentScoreRepository assessmentScoreRepository;
    private final AssessmentQuestionRepository assessmentQuestionRepository;
    private final AssessmentAnswerRepository assessmentAnswerRepository;
    private final FinalScoreRepository finalScoreRepository;
    private final DesiredRoleRepository desiredRoleRepository;

    public List<AdminResumeDto> getAllResumes() {
        return resumeRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    public AdminResumeDto getResumeById(UUID resumeId) {
        ResumeEntity resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new IllegalArgumentException("ไม่พบเรซูเม่ที่ระบุ"));
        return toDto(resume);
    }

    /**
     * ลบเรซูเม่พร้อมข้อมูลลูกทั้งหมด
     * ต้องลบตามลำดับจากลูกสุดขึ้นมาหาแม่ ไม่งั้นติด foreign key constraint
     */
    @Transactional
    public void deleteResume(UUID resumeId) {
        ResumeEntity resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new IllegalArgumentException("ไม่พบเรซูเม่ที่ระบุ"));

        // 1. คำตอบแบบประเมิน (ผูกกับคำถาม ซึ่งผูกกับเรซูเม่อีกที)
        List<AssessmentQuestionEntity> questions = assessmentQuestionRepository.findAll().stream()
                .filter(q -> q.getResume() != null && q.getResume().getId().equals(resumeId))
                .toList();

        List<UUID> questionIds = questions.stream().map(AssessmentQuestionEntity::getId).toList();

        List<AssessmentAnswerEntity> answers = assessmentAnswerRepository.findAll().stream()
                .filter(a -> a.getQuestion() != null && questionIds.contains(a.getQuestion().getId()))
                .toList();
        assessmentAnswerRepository.deleteAll(answers);

        // 2. คำถามแบบประเมิน
        assessmentQuestionRepository.deleteAll(questions);

        // 3. ทักษะที่สกัดจากเรซูเม่
        resumeSkillRepository.deleteAll(resumeSkillRepository.findByResumeEntityId(resumeId));

        // 4. คะแนนทั้ง 3 ชุด
        resumeScoreRepository.deleteAll(resumeScoreRepository.findAll().stream()
                .filter(s -> s.getResume() != null && s.getResume().getId().equals(resumeId))
                .toList());

        assessmentScoreRepository.deleteAll(assessmentScoreRepository.findAll().stream()
                .filter(s -> s.getResume() != null && s.getResume().getId().equals(resumeId))
                .toList());

        finalScoreRepository.deleteAll(finalScoreRepository.findAll().stream()
                .filter(s -> s.getResume() != null && s.getResume().getId().equals(resumeId))
                .toList());

        // 5. ผลวิเคราะห์ gap
        resumeGapAnalysisRepository.deleteAll(resumeGapAnalysisRepository.findAll().stream()
                .filter(g -> g.getResume() != null && g.getResume().getId().equals(resumeId))
                .toList());

        // 6. ตำแหน่งงานที่ต้องการ
        desiredRoleRepository.deleteAll(desiredRoleRepository.findAll().stream()
                .filter(d -> d.getResume() != null && d.getResume().getId().equals(resumeId))
                .toList());

        // 7. ตัวเรซูเม่เอง
        resumeRepository.delete(resume);
    }

    private AdminResumeDto toDto(ResumeEntity resume) {
        UUID resumeId = resume.getId();

        List<ResumeSkillEntity> skills = resumeSkillRepository.findByResumeEntityId(resumeId);

        List<String> hardSkills = skills.stream()
                .filter(s -> "HARD".equals(s.getSkillType()))
                .map(ResumeSkillEntity::getSkillName)
                .toList();

        List<String> softSkills = skills.stream()
                .filter(s -> "SOFT".equals(s.getSkillType()))
                .map(ResumeSkillEntity::getSkillName)
                .toList();

        // คะแนน — อาจยังไม่มีถ้ายังไม่ได้ทำแบบประเมิน
        var resumeScore = resumeScoreRepository.findByResume_Id(resumeId)
                .map(ResumeScoreEntity::getResumeScore)
                .orElse(null);

        var assessmentScore = assessmentScoreRepository.findAll().stream()
                .filter(s -> s.getResume() != null && s.getResume().getId().equals(resumeId))
                .findFirst()
                .map(AssessmentScoreEntity::getAssessmentScore)
                .orElse(null);

        var finalScore = finalScoreRepository.findAll().stream()
                .filter(s -> s.getResume() != null && s.getResume().getId().equals(resumeId))
                .findFirst()
                .map(FinalScoreEntity::getFinalScore)
                .orElse(null);

        // ผลวิเคราะห์ gap
        var gap = resumeGapAnalysisRepository.findByResume_Id(resumeId).orElse(null);
        List<String> missingSkills = (gap != null && gap.getMissingSkills() != null && !gap.getMissingSkills().isBlank())
                ? Arrays.stream(gap.getMissingSkills().split("\\|")).map(String::trim).filter(s -> !s.isEmpty()).toList()
                : List.of();
        String recommendation = gap != null ? gap.getRecommendation() : null;

        // ตำแหน่งงานที่ต้องการ
        String desiredRoleName = desiredRoleRepository.findAll().stream()
                .filter(d -> d.getResume() != null && d.getResume().getId().equals(resumeId))
                .findFirst()
                .map(DesiredRoleEntity::getRoleName)
                .orElse(null);

        return AdminResumeDto.builder()
                .resumeId(resumeId)
                .originalFilename(resume.getOriginalFilename())
                .uploadedAt(resume.getUploadedAt())
                .userId(resume.getUserEntity() != null ? resume.getUserEntity().getId() : null)
                .userEmail(resume.getUserEntity() != null ? resume.getUserEntity().getEmail() : null)
                .userFullName(resume.getUserEntity() != null ? resume.getUserEntity().getFullName() : null)
                .hardSkills(hardSkills)
                .softSkills(softSkills)
                .desiredRoleName(desiredRoleName)
                .resumeScore(resumeScore)
                .assessmentScore(assessmentScore)
                .finalScore(finalScore)
                .assessmentCompleted(assessmentScore != null)
                .missingSkills(missingSkills)
                .recommendation(recommendation)
                .build();
    }
}