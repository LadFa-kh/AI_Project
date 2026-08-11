package com.example.backend.assessment.service;

import com.example.backend.assessment.dto.AssessmentScoreResponseDto;
import com.example.backend.assessment.dto.RecommendationResponseDto;
import com.example.backend.assessment.dto.RoleTranslationResponseDto;
import com.example.backend.assessment.dto.SubmitAssessmentRequestDto;
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
import com.example.backend.resume.service.SkillTaxonomyService;
import com.example.backend.user.entity.UserEntity;
import com.example.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssessmentService {

    private static final int MIN_SCORE_PER_QUESTION = 1;
    private static final int MAX_SCORE_PER_QUESTION = 4;
    private static final String GENERATE_RECOMMENDATION_PATH = "/api/v1/python/generate-recommendation";
    private static final String TRANSLATE_ROLE_NAME_PATH = "/api/v1/python/translate-role-name"; // [NEW]

    private final AssessmentAnswerRepository answerRepository;
    private final AssessmentQuestionRepository questionRepository;
    private final AssessmentScoreRepository assessmentScoreRepository;
    private final ResumeRepository resumeRepository;
    private final ResumeScoreRepository resumeScoreRepository;
    private final FinalScoreRepository finalScoreRepository;
    private final UserRepository userRepository;
    private final ResumeGapAnalysisRepository resumeGapAnalysisRepository;
    private final ResumeSkillRepository resumeSkillRepository;
    private final SkillTaxonomyService skillTaxonomyService;
    private final DesiredRoleRepository desiredRoleRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${fastapi.base.url:http://fastapi-ai:8000}")
    private String fastapiBaseUrl;

    @Transactional
    public AssessmentScoreResponseDto submitAssessment(SubmitAssessmentRequestDto request) {
        UserEntity user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        ResumeEntity resume = resumeRepository.findById(request.getResumeId())
                .orElseThrow(() -> new RuntimeException("Resume not found"));

        if (!resume.getUserEntity().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Resume นี้ไม่ได้เป็นของ user ที่ระบุ");
        }

        if (request.getDesiredRoleName() == null || request.getDesiredRoleName().isBlank()) {
            throw new IllegalArgumentException("ต้องระบุตำแหน่งงานที่ต้องการ");
        }

        if (assessmentScoreRepository.existsByResume_Id(resume.getId())) {
            throw new IllegalStateException("Resume นี้ทำแบบประเมินไปแล้ว ไม่สามารถส่งซ้ำได้");
        }

        List<SubmitAssessmentRequestDto.AnswerItem> answers = request.getAnswers();

        if (answers == null || answers.isEmpty()) {
            throw new IllegalArgumentException("ต้องตอบแบบประเมินอย่างน้อย 1 ข้อ");
        }

        Set<UUID> requestedQuestionIds = answers.stream()
                .map(SubmitAssessmentRequestDto.AnswerItem::getQuestionId)
                .collect(Collectors.toSet());
        if (requestedQuestionIds.size() != answers.size()) {
            throw new IllegalArgumentException("พบ questionId ซ้ำกันในคำขอเดียว");
        }

        List<AssessmentQuestionEntity> expectedQuestions = questionRepository.findByResume_Id(resume.getId());
        Set<UUID> expectedQuestionIds = expectedQuestions.stream()
                .map(AssessmentQuestionEntity::getId)
                .collect(Collectors.toSet());

        if (!requestedQuestionIds.equals(expectedQuestionIds)) {
            throw new IllegalArgumentException(
                    "ต้องตอบให้ครบทุกข้อที่ระบบสร้างไว้ (ทั้งหมด " + expectedQuestionIds.size()
                            + " ข้อ) และห้ามมี questionId ที่ไม่ใช่ของ resume นี้"
            );
        }

        for (SubmitAssessmentRequestDto.AnswerItem item : answers) {
            int score = item.getSelectedScore();
            if (score < MIN_SCORE_PER_QUESTION || score > MAX_SCORE_PER_QUESTION) {
                throw new IllegalArgumentException(
                        "selectedScore ต้องอยู่ระหว่าง " + MIN_SCORE_PER_QUESTION
                                + "-" + MAX_SCORE_PER_QUESTION + " แต่ได้รับค่า " + score
                                + " (questionId=" + item.getQuestionId() + ")"
                );
            }
        }

        Map<UUID, AssessmentQuestionEntity> questionById = expectedQuestions.stream()
                .collect(Collectors.toMap(AssessmentQuestionEntity::getId, q -> q));

        int totalScoreObtained = 0;
        int maxPossibleScore = answers.size() * MAX_SCORE_PER_QUESTION;

        for (SubmitAssessmentRequestDto.AnswerItem item : answers) {
            AssessmentQuestionEntity question = questionById.get(item.getQuestionId());

            AssessmentAnswerEntity answer = new AssessmentAnswerEntity();
            answer.setUser(user);
            answer.setQuestion(question);
            answer.setSelectedScore(item.getSelectedScore());
            answer.setAnsweredAt(Instant.now());
            answerRepository.save(answer);

            totalScoreObtained += item.getSelectedScore();
        }

        BigDecimal assessmentScore = BigDecimal.valueOf(totalScoreObtained)
                .divide(BigDecimal.valueOf(maxPossibleScore), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);

        AssessmentScoreEntity scoreEntity = new AssessmentScoreEntity();
        scoreEntity.setUser(user);
        scoreEntity.setResume(resume);
        scoreEntity.setAssessmentScore(assessmentScore);
        scoreEntity.setSubmittedAt(Instant.now());
        assessmentScoreRepository.save(scoreEntity);

        // บันทึก DesiredRoleEntity ด้วย "ภาษาต้นฉบับ" ตามที่ user กรอกมาเสมอ (ไม่ใช้ตัวแปล)
        DesiredRoleEntity desiredRole = new DesiredRoleEntity();
        desiredRole.setUser(user);
        desiredRole.setRoleName(request.getDesiredRoleName());
        desiredRole.setResume(resume);
        desiredRoleRepository.save(desiredRole);

        // [NEW] แปล desiredRoleName เป็นอังกฤษก่อน ค่อยเอาไปหา standardSkills
        String englishRoleName = translateRoleNameToEnglish(request.getDesiredRoleName());

        List<String> hardSkills = resumeSkillRepository.findByResumeEntityId(resume.getId()).stream()
                .filter(s -> "HARD".equals(s.getSkillType()))
                .map(ResumeSkillEntity::getSkillName)
                .toList();

        List<String> standardSkills = skillTaxonomyService.extractAndAggregateStandardSkills(englishRoleName);

        BigDecimal resumeScore = skillTaxonomyService.calculateOnetSkillMatchScore(hardSkills, standardSkills);

        ResumeScoreEntity resumeScoreEntity = new ResumeScoreEntity();
        resumeScoreEntity.setResume(resume);
        resumeScoreEntity.setResumeScore(resumeScore);
        resumeScoreRepository.save(resumeScoreEntity);

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

        // recommendation ยังใช้ desiredRoleName ต้นฉบับ (ไทย) ตามเดิม เพราะ Gemini อ่านไทยได้อยู่แล้ว
        String assessmentSummary = answers.stream()
                .map(item -> {
                    AssessmentQuestionEntity q = questionById.get(item.getQuestionId());
                    return q.getQuestionText() + ": " + item.getSelectedScore() + "/" + MAX_SCORE_PER_QUESTION;
                })
                .collect(Collectors.joining("\n"));

        RecommendationResponseDto recommendationResult = callPythonRecommendationApi(
                request.getDesiredRoleName(), standardSkills, hardSkills, assessmentSummary
        );

        List<String> missingSkillsList = recommendationResult.getMissing_skills() != null
                ? recommendationResult.getMissing_skills() : List.of();
        String recommendation = recommendationResult.getRecommendation();

        ResumeGapAnalysisEntity gapEntity = resumeGapAnalysisRepository.findByResume_Id(resume.getId())
                .orElseGet(ResumeGapAnalysisEntity::new);
        gapEntity.setResume(resume);
        gapEntity.setMissingSkills(String.join(" | ", missingSkillsList));
        gapEntity.setRecommendation(recommendation);
        gapEntity.setCreatedAt(Instant.now());
        resumeGapAnalysisRepository.save(gapEntity);

        return AssessmentScoreResponseDto.builder()
                .resumeId(resume.getId())
                .resumeScore(resumeScore)
                .assessmentScore(assessmentScore)
                .finalScore(finalScore)
                .missingSkills(missingSkillsList)
                .recommendation(recommendation)
                .build();
    }

    /**
     * [NEW] แปล desiredRoleName เป็นชื่ออาชีพภาษาอังกฤษผ่าน Python/Gemini
     * ถ้าแปลไม่สำเร็จ (Python ล่ม) fallback กลับไปใช้ค่าต้นฉบับ แทนที่จะทำให้ submit ทั้งหมดพัง
     */
    private String translateRoleNameToEnglish(String desiredRoleName) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("desiredRoleName", desiredRoleName);

        HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<RoleTranslationResponseDto> response = restTemplate.postForEntity(
                    fastapiBaseUrl + TRANSLATE_ROLE_NAME_PATH, requestEntity, RoleTranslationResponseDto.class);
            RoleTranslationResponseDto result = response.getBody();
            if (result != null && result.getEnglish_role_name() != null && !result.getEnglish_role_name().isBlank()) {
                return result.getEnglish_role_name();
            }
        } catch (HttpStatusCodeException e) {
            System.err.println("Role translation failed, falling back to original text: " + e.getResponseBodyAsString());
        }
        return desiredRoleName; // fallback — ถ้าแปลไม่ได้ ใช้ค่าเดิม (เผื่อ user พิมพ์อังกฤษมาอยู่แล้วจริงๆ)
    }

    private RecommendationResponseDto callPythonRecommendationApi(String desiredRoleName, List<String> standardSkills,
                                                                  List<String> hardSkills, String assessmentSummary) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("desiredRoleName", desiredRoleName);
        body.add("standardSkills", String.join(" | ", standardSkills));
        body.add("hardSkills", String.join(" | ", hardSkills));
        body.add("assessmentSummary", assessmentSummary);

        HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<RecommendationResponseDto> response = restTemplate.postForEntity(
                    fastapiBaseUrl + GENERATE_RECOMMENDATION_PATH, requestEntity, RecommendationResponseDto.class);
            return response.getBody();
        } catch (HttpStatusCodeException e) {
            throw new RuntimeException("Python recommendation service failed: " + e.getResponseBodyAsString(), e);
        }
    }
}