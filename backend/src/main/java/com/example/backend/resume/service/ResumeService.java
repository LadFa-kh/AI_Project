    package com.example.backend.resume.service;

    import com.example.backend.assessment.entity.AssessmentQuestionEntity;
    import com.example.backend.assessment.repository.AssessmentQuestionRepository;
    import com.example.backend.desiredRole.entity.DesiredRoleEntity;
    import com.example.backend.desiredRole.repository.DesiredRoleRepository;
    import com.example.backend.resume.entity.ResumeEntity;
    import com.example.backend.resume.entity.ResumeGapAnalysisEntity;
    import com.example.backend.resume.entity.ResumeScoreEntity;
    import com.example.backend.resume.entity.ResumeSkillEntity;
    import com.example.backend.resume.dto.python.PythonResumeResponseDto;
    import com.example.backend.resume.dto.ResumeUploadResponseDto;
    import com.example.backend.resume.repository.*;
    import com.example.backend.user.entity.UserEntity;
    import com.example.backend.user.repository.UserRepository;
    import lombok.RequiredArgsConstructor;
    import org.springframework.beans.factory.annotation.Value;
    import org.springframework.core.io.ByteArrayResource;
    import org.springframework.http.*;
    import org.springframework.stereotype.Service;
    import org.springframework.transaction.annotation.Transactional;
    import org.springframework.util.LinkedMultiValueMap;
    import org.springframework.util.MultiValueMap;
    import org.springframework.web.client.HttpStatusCodeException;
    import org.springframework.web.client.RestTemplate;
    import org.springframework.web.multipart.MultipartFile;

    import java.io.IOException;
    import java.math.BigDecimal;
    import java.math.RoundingMode;
    import java.nio.file.Files;
    import java.nio.file.Path;
    import java.nio.file.Paths;
    import java.security.MessageDigest;
    import java.time.Instant;
    import java.util.*;

    @Service
    @RequiredArgsConstructor
    public class ResumeService {

        private final ResumeRepository resumeRepository;
        private final ResumeSkillRepository resumeSkillRepository;
        private final AssessmentQuestionRepository assessmentQuestionRepository;
        private final UserRepository userRepository;
        private final RestTemplate restTemplate = new RestTemplate();

        @Value("${fastapi.base.url:http://fastapi-ai:8000}")
        private String fastapiBaseUrl;
        private static final String PYTHON_PROCESS_RESUME_PATH = "/api/v1/python/process-resume";

        private final String UPLOAD_DIR = "uploads/resumes/";

        @Transactional
        public ResumeUploadResponseDto processAndSaveResume(UUID userId, MultipartFile file) throws Exception {
            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // 1. คำนวณ SHA-256 File Hash
            String fileHash = calculateSHA256(file.getBytes());

            // 2. บันทึกไฟล์ PDF ลง Server Storage
            String storedFilename = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            Path filePath = uploadPath.resolve(storedFilename);
            Files.write(filePath, file.getBytes());

            // 3. ยิงไป Python Microservice เพื่อดึง Skills & Questions (ไม่ส่ง desiredRoleName แล้ว)
            PythonResumeResponseDto pythonResponse;
            try {
                pythonResponse = callPythonApi(file);
            } catch (Exception e) {
                Files.deleteIfExists(filePath);
                throw e;
            }

            // 4. บันทึกลง ResumeEntity
            ResumeEntity resume = new ResumeEntity();
            resume.setUserEntity(user);
            resume.setFilePath(filePath.toString());
            resume.setStoredFilename(storedFilename);
            resume.setOriginalFilename(file.getOriginalFilename());
            resume.setFileHash(fileHash);
            resume.setUploadedAt(Instant.now());
            resumeRepository.save(resume);

            // 5. บันทึกลง ResumeSkillEntity (แยก Hard/Soft เหมือนเดิม)
            List<String> hardSkills = (pythonResponse.getResume_data() != null && pythonResponse.getResume_data().getHard_skills() != null)
                    ? pythonResponse.getResume_data().getHard_skills()
                    : Collections.emptyList();

            List<String> softSkills = (pythonResponse.getResume_data() != null && pythonResponse.getResume_data().getSoft_skills() != null)
                    ? pythonResponse.getResume_data().getSoft_skills()
                    : Collections.emptyList();

            saveSkillsByType(resume, hardSkills, "HARD");
            saveSkillsByType(resume, softSkills, "SOFT");

            // 6. บันทึกคำถามลง AssessmentQuestionEntity
            List<PythonResumeResponseDto.QuestionData> savedQuestionsForResponse = new ArrayList<>();

            if (pythonResponse.getQuestions() != null) {
                for (PythonResumeResponseDto.QuestionData q : pythonResponse.getQuestions()) {
                    AssessmentQuestionEntity questionEntity = new AssessmentQuestionEntity();
                    questionEntity.setResume(resume);
                    questionEntity.setQuestionText(q.getQuestion());
                    if (q.getOptions() != null && q.getOptions().size() >= 4) {
                        questionEntity.setOptionsA(q.getOptions().get(0));
                        questionEntity.setOptionsB(q.getOptions().get(1));
                        questionEntity.setOptionsC(q.getOptions().get(2));
                        questionEntity.setOptionsD(q.getOptions().get(3));
                    } else {
                        System.err.println("WARNING: Question options ไม่ครบ 4 ข้อ, question=" + q.getQuestion()
                                + ", options size=" + (q.getOptions() == null ? 0 : q.getOptions().size()));
                    }
                    AssessmentQuestionEntity saved = assessmentQuestionRepository.save(questionEntity);

                    PythonResumeResponseDto.QuestionData responseItem = new PythonResumeResponseDto.QuestionData();
                    responseItem.setId(String.valueOf(saved.getId()));
                    responseItem.setQuestion(saved.getQuestionText());
                    responseItem.setOptions(q.getOptions());
                    savedQuestionsForResponse.add(responseItem);
                }
            }

            // 7. Return Response
            List<String> allExtractedSkills = new ArrayList<>();
            allExtractedSkills.addAll(hardSkills);
            allExtractedSkills.addAll(softSkills);

            return ResumeUploadResponseDto.builder()
                    .resumeId(resume.getId())
                    .extractedSkills(allExtractedSkills)
                    .questions(savedQuestionsForResponse)
                    .build();
        }

        private PythonResumeResponseDto callPythonApi(MultipartFile file) throws IOException {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };

            body.add("file", fileResource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            try {
                ResponseEntity<PythonResumeResponseDto> response = restTemplate.postForEntity(
                        fastapiBaseUrl + PYTHON_PROCESS_RESUME_PATH, requestEntity, PythonResumeResponseDto.class);
                return response.getBody();
            } catch (HttpStatusCodeException e) {
                System.err.println("Python service error status: " + e.getStatusCode());
                System.err.println("Python service error body: " + e.getResponseBodyAsString());
                throw new RuntimeException("Python service failed: " + e.getResponseBodyAsString(), e);
            }
        }

        private String calculateSHA256(byte[] data) throws Exception {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        }

        private void saveSkillsByType(ResumeEntity resume, List<String> skills, String skillType) {
            Set<String> uniqueSkills = new LinkedHashSet<>(skills);
            for (String skillName : uniqueSkills) {
                ResumeSkillEntity skillEntity = new ResumeSkillEntity();
                skillEntity.setResumeEntity(resume);
                skillEntity.setSkillName(skillName);
                skillEntity.setSkillType(skillType);
                resumeSkillRepository.save(skillEntity);
            }
        }
    }