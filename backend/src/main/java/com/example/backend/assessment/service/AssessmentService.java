package com.example.backend.assessment.service;

import com.example.backend.assessment.dto.AssessmentScoreResponseDto;
import com.example.backend.assessment.dto.SubmitAssessmentRequestDto;
import com.example.backend.assessment.entity.AssessmentAnswerEntity;
import com.example.backend.assessment.entity.AssessmentQuestionEntity;
import com.example.backend.assessment.entity.AssessmentScoreEntity;
import com.example.backend.assessment.repository.AssessmentAnswerRepository;
import com.example.backend.assessment.repository.AssessmentQuestionRepository;
import com.example.backend.assessment.repository.AssessmentScoreRepository;
import com.example.backend.finalscore.entity.FinalScoreEntity;
import com.example.backend.finalscore.repository.FinalScoreRepository;
import com.example.backend.resume.entity.ResumeEntity;
import com.example.backend.resume.entity.ResumeScoreEntity;
import com.example.backend.resume.repository.ResumeRepository;
import com.example.backend.resume.repository.ResumeScoreRepository;
import com.example.backend.resume.repository.ResumeSkillRepository;
import com.example.backend.user.entity.UserEntity;
import com.example.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AssessmentService {

    private final AssessmentAnswerRepository answerRepository;
    private final AssessmentQuestionRepository questionRepository;
    private final AssessmentScoreRepository assessmentScoreRepository;
    private final ResumeRepository resumeRepository;
    private final ResumeSkillRepository resumeSkillRepository; // Inject เพิ่มเพื่อนับ Skill จาก DB จริง
    private final ResumeScoreRepository resumeScoreRepository;
    private final FinalScoreRepository finalScoreRepository;
    private final UserRepository userRepository;

    @Transactional
    public AssessmentScoreResponseDto submitAssessment(SubmitAssessmentRequestDto request) {
        UserEntity user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        ResumeEntity resume = resumeRepository.findById(request.getResumeId())
                .orElseThrow(() -> new RuntimeException("Resume not found"));

        int totalScoreObtained = 0;
        int maxPossibleScore = request.getAnswers().size() * 4; // คะแนนเต็ม (ข้อละ 4 คะแนน)

        // 1. บันทึกคำตอบแต่ละข้อ
        for (SubmitAssessmentRequestDto.AnswerItem item : request.getAnswers()) {
            AssessmentQuestionEntity question = questionRepository.findById(item.getQuestionId())
                    .orElseThrow(() -> new RuntimeException("Question not found"));

            AssessmentAnswerEntity answer = new AssessmentAnswerEntity();
            answer.setUser(user);
            answer.setQuestion(question);
            answer.setSelectedScore(item.getSelectedScore());
            answer.setAnsweredAt(Instant.now());
            answerRepository.save(answer);

            totalScoreObtained += item.getSelectedScore();
        }

        // 2. คำนวณ Assessment Score คิดเป็น % เต็ม 100 (น้ำหนักจริง 40%)
        double assessmentCalc = ((double) totalScoreObtained / maxPossibleScore) * 100;
        BigDecimal assessmentScore = BigDecimal.valueOf(assessmentCalc).setScale(2, RoundingMode.HALF_UP);

        AssessmentScoreEntity scoreEntity = new AssessmentScoreEntity();
        scoreEntity.setUser(user);
        scoreEntity.setResume(resume);
        scoreEntity.setAssessmentScore(assessmentScore);
        scoreEntity.setSubmittedAt(Instant.now());
        assessmentScoreRepository.save(scoreEntity);

        // 3. คำนวณ/บันทึก Resume Score จากข้อมูลจริงใน DB
        BigDecimal resumeScore = calculateResumeScore(resume);
        ResumeScoreEntity resumeScoreEntity = new ResumeScoreEntity();
        resumeScoreEntity.setResume(resume);
        resumeScoreEntity.setResumeScore(resumeScore);
        resumeScoreRepository.save(resumeScoreEntity);

        // 4. คำนวณ Final Score ตามสเปกจริง: Resume 60% (0.6) + Assessment 40% (0.4)
        BigDecimal finalScore = resumeScore.multiply(BigDecimal.valueOf(0.6))
                .add(assessmentScore.multiply(BigDecimal.valueOf(0.4)))
                .setScale(2, RoundingMode.HALF_UP);

        FinalScoreEntity finalScoreEntity = new FinalScoreEntity();
        finalScoreEntity.setUser(user);
        finalScoreEntity.setResume(resume);
        finalScoreEntity.setResumeScore(resumeScore);
        finalScoreEntity.setAssessmentScore(assessmentScore);
        finalScoreEntity.setFinalScore(finalScore);
        finalScoreRepository.save(finalScoreEntity);

        // 5. Return ผลลัพธ์กลับไปให้ Frontend
        return AssessmentScoreResponseDto.builder()
                .resumeId(resume.getId())
                .resumeScore(resumeScore)
                .assessmentScore(assessmentScore)
                .finalScore(finalScore)
                .build();
    }

    private BigDecimal calculateResumeScore(ResumeEntity resume) {
        // ดึงจำนวน Skill จริงจาก ResumeSkillRepository ผ่าน resume.getId()
        int skillCount = resumeSkillRepository.findByResumeEntityId(resume.getId()).size();

        // ตัวอย่างเกณฑ์: เจอ 1 Skill ให้ 10 คะแนน (ปรับสูตรได้ตามเกณฑ์จริงของคุณแอ็กซ์เลยครับ)
        double score = Math.min(skillCount * 10.0, 100.0);
        return BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP);
    }
}