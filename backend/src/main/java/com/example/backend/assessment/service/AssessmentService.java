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
import com.example.backend.resume.service.SkillMatchResult;
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
import com.example.backend.assessment.dto.RoleInferenceResponseDto;

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

    // น้ำหนักของคะแนนสองส่วนที่ประกอบกันเป็นคะแนนรวม (ต้องบวกกันได้ 1.00)
    // เดิมเลขสองตัวนี้ฝังอยู่กลางสูตร ทำให้ไม่มีใครตอบได้ว่าคะแนนมาจากไหนโดยไม่ไล่โค้ด
    // ดึงออกมาตั้งชื่อไว้ตรงนี้ และส่งออกไปกับผลลัพธ์ด้วย เพื่อให้หน้าเว็บอ้างอิงค่าเดียวกัน
    private static final BigDecimal RESUME_WEIGHT = BigDecimal.valueOf(0.6);
    private static final BigDecimal ASSESSMENT_WEIGHT = BigDecimal.valueOf(0.4);
    private static final String GENERATE_RECOMMENDATION_PATH = "/api/v1/python/generate-recommendation";
    private static final String TRANSLATE_ROLE_NAME_PATH = "/api/v1/python/translate-role-name";
    private static final String INFER_ROLE_PATH = "/api/v1/python/infer-role-from-skills"; // [NEW]

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
    public AssessmentScoreResponseDto submitAssessment(UUID userId, SubmitAssessmentRequestDto request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        ResumeEntity resume = resumeRepository.findById(request.getResumeId())
                .orElseThrow(() -> new RuntimeException("Resume not found"));

        if (!resume.getUserEntity().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Resume นี้ไม่ได้เป็นของ user ที่ระบุ");
        }

        // [CHANGED] desiredRoleName เป็น optional แล้ว — เอาการเช็คบังคับกรอกออก
        // ถ้าไม่กรอก จะให้ AI เดาอาชีพที่เหมาะสมจากทักษะในเรซูเม่แทน (ดูด้านล่าง)

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

        // ดึง hard skills มาก่อน — ใช้ทั้งตอนหา standardSkills และตอนให้ AI เดาอาชีพ (ถ้าจำเป็น)
        List<String> hardSkills = resumeSkillRepository.findByResumeEntityId(resume.getId()).stream()
                .filter(s -> "HARD".equals(s.getSkillType()))
                .map(ResumeSkillEntity::getSkillName)
                .toList();

        // [CHANGED] ถ้ามี desiredRoleName ใช้ตามเดิม (แปลเป็นอังกฤษก่อน)
        // ถ้าไม่มี ให้ AI เดาอาชีพจากทักษะในเรซูเม่แทน (ได้เป็นภาษาอังกฤษอยู่แล้ว ไม่ต้องแปลซ้ำ)
        String effectiveRoleName;
        String englishRoleName;
        boolean roleInferredByAi;

        if (request.getDesiredRoleName() != null && !request.getDesiredRoleName().isBlank()) {
            effectiveRoleName = request.getDesiredRoleName();
            englishRoleName = translateRoleNameToEnglish(effectiveRoleName);
            roleInferredByAi = false;
        } else {
            englishRoleName = inferRoleFromSkills(hardSkills);
            effectiveRoleName = englishRoleName; // ไม่มีข้อความต้นฉบับจาก user ให้ใช้ตัวที่ AI เดามาแทนทั้งสองจุด
            roleInferredByAi = true;
        }

        // บันทึก DesiredRoleEntity เสมอ ไม่ว่าจะมาจาก user พิมพ์เองหรือ AI เดาให้
        DesiredRoleEntity desiredRole = new DesiredRoleEntity();
        desiredRole.setUser(user);
        desiredRole.setRoleName(effectiveRoleName);
        desiredRole.setResume(resume);
        desiredRoleRepository.save(desiredRole);

        List<String> standardSkills = skillTaxonomyService.extractAndAggregateStandardSkills(englishRoleName);

        SkillMatchResult matchResult = skillTaxonomyService.calculateOnetSkillMatchDetail(hardSkills, standardSkills);
        BigDecimal resumeScore = matchResult.getResumeScore();

        ResumeScoreEntity resumeScoreEntity = new ResumeScoreEntity();
        resumeScoreEntity.setResume(resume);
        resumeScoreEntity.setResumeScore(resumeScore);
        resumeScoreRepository.save(resumeScoreEntity);

        // แยกผลคูณของแต่ละส่วนออกมาเป็นตัวแปร เพื่อส่งออกไปแสดงว่าคะแนนรวมมาจากไหนบ้าง
        BigDecimal resumeContribution = resumeScore.multiply(RESUME_WEIGHT).setScale(2, RoundingMode.HALF_UP);
        BigDecimal assessmentContribution = assessmentScore.multiply(ASSESSMENT_WEIGHT).setScale(2, RoundingMode.HALF_UP);
        BigDecimal finalScore = resumeScore.multiply(RESUME_WEIGHT)
                .add(assessmentScore.multiply(ASSESSMENT_WEIGHT))
                .setScale(2, RoundingMode.HALF_UP);

        FinalScoreEntity finalScoreEntity = new FinalScoreEntity();
        finalScoreEntity.setUser(user);
        finalScoreEntity.setResume(resume);
        finalScoreEntity.setResumeScore(resumeScore);
        finalScoreEntity.setAssessmentScore(assessmentScore);
        finalScoreEntity.setFinalScore(finalScore);
        finalScoreRepository.save(finalScoreEntity);

        String assessmentSummary = answers.stream()
                .map(item -> {
                    AssessmentQuestionEntity q = questionById.get(item.getQuestionId());
                    return q.getQuestionText() + ": " + item.getSelectedScore() + "/" + MAX_SCORE_PER_QUESTION;
                })
                .collect(Collectors.joining("\n"));

        // ประกอบที่มาของคะแนนจากค่าที่คำนวณไว้แล้วทั้งหมด ไม่มีค่าใดมาจากปัญญาประดิษฐ์
        ScoreBreakdownDto breakdown = ScoreBreakdownDto.builder()
                .totalResumeSkills(matchResult.getTotalResumeSkills())
                .totalStandardSkills(matchResult.getTotalStandardSkills())
                .matchedSkills(matchResult.getMatchedSkills())
                .unmatchedSkills(matchResult.getUnmatchedSkills())
                .precisionScore(matchResult.getPrecisionScore())
                .penaltyFactor(matchResult.getPenaltyFactor())
                .resumeScore(resumeScore)
                .resumeScoreReason(matchResult.getReason())
                .answeredQuestions(answers.size())
                .maxScorePerQuestion(MAX_SCORE_PER_QUESTION)
                .totalScoreObtained(totalScoreObtained)
                .maxPossibleScore(maxPossibleScore)
                .assessmentScore(assessmentScore)
                .resumeWeight(RESUME_WEIGHT)
                .assessmentWeight(ASSESSMENT_WEIGHT)
                .resumeContribution(resumeContribution)
                .assessmentContribution(assessmentContribution)
                .finalScore(finalScore)
                .roleUsedForMatching(effectiveRoleName)
                .roleInferredByAi(roleInferredByAi)
                .build();

        RecommendationResponseDto recommendationResult = callPythonRecommendationApi(
                effectiveRoleName, standardSkills, hardSkills, assessmentSummary, breakdown
        );

        List<String> missingSkillsList = recommendationResult.getMissing_skills() != null
                ? recommendationResult.getMissing_skills() : List.of();
        String recommendationSummary = recommendationResult.getRecommendation_summary();
        List<String> recommendationItems = recommendationResult.getRecommendation_items() != null
                ? recommendationResult.getRecommendation_items() : List.of();

        ResumeGapAnalysisEntity gapEntity = resumeGapAnalysisRepository.findByResume_Id(resume.getId())
                .orElseGet(ResumeGapAnalysisEntity::new);
        gapEntity.setResume(resume);
        gapEntity.setMissingSkills(String.join(" | ", missingSkillsList));
        gapEntity.setRecommendation(recommendationSummary);
        gapEntity.setCreatedAt(Instant.now());
        resumeGapAnalysisRepository.save(gapEntity);

        return AssessmentScoreResponseDto.builder()
                .resumeId(resume.getId())
                .resumeScore(resumeScore)
                .assessmentScore(assessmentScore)
                .finalScore(finalScore)
                .missingSkills(missingSkillsList)
                .recommendationSummary(recommendationSummary)
                .recommendationItems(recommendationItems)
                .scoreBreakdown(breakdown)
                .scoreExplanation(recommendationResult.getScore_explanation())
                .build();
    }

    /**
     * แปล desiredRoleName เป็นชื่ออาชีพภาษาอังกฤษผ่าน Python/Gemini
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
        return desiredRoleName;
    }

    /**
     * [NEW] เดาอาชีพที่เหมาะสมจากทักษะในเรซูเม่ผ่าน Python/Gemini
     * ใช้เมื่อ user ไม่ได้กรอก desiredRoleName มา
     * ถ้าเดาไม่สำเร็จ fallback เป็น string ว่าง — standardSkills จะกลายเป็น list ว่าง (resumeScore = 0)
     * แทนที่จะทำให้ submit ทั้งหมดพัง เหมือน pattern เดียวกับ translateRoleNameToEnglish
     */
    private String inferRoleFromSkills(List<String> hardSkills) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("hardSkills", String.join(" | ", hardSkills));

        HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<RoleInferenceResponseDto> response = restTemplate.postForEntity(
                    fastapiBaseUrl + INFER_ROLE_PATH, requestEntity, RoleInferenceResponseDto.class);
            RoleInferenceResponseDto result = response.getBody();
            if (result != null && result.getInferred_role_name() != null && !result.getInferred_role_name().isBlank()) {
                return result.getInferred_role_name();
            }
        } catch (HttpStatusCodeException e) {
            System.err.println("Role inference failed, falling back to empty: " + e.getResponseBodyAsString());
        }
        return "";
    }

    /**
     * ส่งข้อมูลไปให้ Python เขียนคำแนะนำและคำอธิบายที่มาของคะแนน
     *
     * ตัวเลขคะแนนทุกค่าใน scoreFacts คำนวณเสร็จแล้วจากฝั่งนี้ ปัญญาประดิษฐ์มีหน้าที่
     * เรียบเรียงเป็นภาษาไทยเท่านั้น ห้ามคำนวณเอง เพราะถ้าให้คำนวณเองตัวเลขในคำอธิบาย
     * จะไม่ตรงกับตัวเลขที่แสดงบนหน้าจอ ซึ่งเป็นข้อมูลที่ผู้ใช้เห็นพร้อมกันทั้งสองอย่าง
     */
    private RecommendationResponseDto callPythonRecommendationApi(String desiredRoleName, List<String> standardSkills,
                                                                  List<String> hardSkills, String assessmentSummary,
                                                                  ScoreBreakdownDto b) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        // ส่งเป็นข้อความบรรทัดต่อบรรทัด อ่านง่ายทั้งสำหรับแบบจำลองภาษาและตอนไล่ปัญหาใน log
        String scoreFacts = String.join("\n",
                "ตำแหน่งงานที่ใช้เทียบ: " + b.getRoleUsedForMatching()
                        + (b.isRoleInferredByAi() ? " (ระบบวิเคราะห์ให้จากทักษะในเรซูเม่ ผู้ใช้ไม่ได้กรอกเอง)" : " (ผู้ใช้กรอกเอง)"),
                "",
                "ส่วนที่ 1 คะแนนเรซูเม่ (น้ำหนัก " + b.getResumeWeight() + ")",
                "  ทักษะที่สกัดจากเรซูเม่ทั้งหมด: " + b.getTotalResumeSkills() + " รายการ",
                "  ทักษะมาตรฐาน O*NET ของตำแหน่งนี้: " + b.getTotalStandardSkills() + " รายการ",
                "  จับคู่ได้: " + b.getMatchedSkills().size() + " รายการ -> " + String.join(", ", b.getMatchedSkills()),
                "  จับคู่ไม่ได้: " + b.getUnmatchedSkills().size() + " รายการ -> " + String.join(", ", b.getUnmatchedSkills()),
                "  precision = (" + b.getMatchedSkills().size() + " / " + b.getTotalResumeSkills() + ") x 100 = " + b.getPrecisionScore(),
                "  ตัวถ่วงตามจำนวนที่จับคู่ได้ = " + b.getPenaltyFactor(),
                "  คะแนนเรซูเม่ = " + b.getPrecisionScore() + " x " + b.getPenaltyFactor() + " = " + b.getResumeScore(),
                "  เหตุผล: " + b.getResumeScoreReason(),
                "",
                "ส่วนที่ 2 คะแนนแบบประเมินตนเอง (น้ำหนัก " + b.getAssessmentWeight() + ")",
                "  ตอบทั้งหมด " + b.getAnsweredQuestions() + " ข้อ ข้อละไม่เกิน " + b.getMaxScorePerQuestion() + " คะแนน",
                "  ได้ " + b.getTotalScoreObtained() + " จากเต็ม " + b.getMaxPossibleScore(),
                "  คะแนนแบบประเมิน = (" + b.getTotalScoreObtained() + " / " + b.getMaxPossibleScore() + ") x 100 = " + b.getAssessmentScore(),
                "",
                "ส่วนที่ 3 คะแนนรวม",
                "  จากเรซูเม่ = " + b.getResumeScore() + " x " + b.getResumeWeight() + " = " + b.getResumeContribution(),
                "  จากแบบประเมิน = " + b.getAssessmentScore() + " x " + b.getAssessmentWeight() + " = " + b.getAssessmentContribution(),
                "  คะแนนรวม = " + b.getResumeContribution() + " + " + b.getAssessmentContribution() + " = " + b.getFinalScore()
        );

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("desiredRoleName", desiredRoleName);
        body.add("standardSkills", String.join(" | ", standardSkills));
        body.add("hardSkills", String.join(" | ", hardSkills));
        body.add("assessmentSummary", assessmentSummary);
        body.add("scoreFacts", scoreFacts);

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