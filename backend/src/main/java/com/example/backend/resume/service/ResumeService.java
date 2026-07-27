package com.example.backend.resume.service;

import com.example.backend.assessment.entity.AssessmentQuestionEntity;
import com.example.backend.assessment.repository.AssessmentQuestionRepository;
import com.example.backend.resume.python.PythonResumeResponseDto;
import com.example.backend.resume.python.ResumeUploadResponseDto;
import com.example.backend.resume.entity.ResumeEntity;
import com.example.backend.resume.entity.ResumeSkillEntity;
import com.example.backend.resume.repository.ResumeRepository;
import com.example.backend.resume.repository.ResumeSkillRepository;
import com.example.backend.user.entity.UserEntity;
import com.example.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final ResumeSkillRepository resumeSkillRepository;
    private final AssessmentQuestionRepository assessmentQuestionRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    private final String PYTHON_SERVICE_URL = "http://localhost:8000/api/v1/python/process-resume";
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

        // 3. ยิงไป Python Microservice เพื่อดึง Skills & Questions
        PythonResumeResponseDto pythonResponse = callPythonApi(file);

        // 4. บันทึกลง ResumeEntity
        ResumeEntity resume = new ResumeEntity();
        resume.setUserEntity(user);
        resume.setFilePath(filePath.toString());
        resume.setStoredFilename(storedFilename);
        resume.setOriginalFilename(file.getOriginalFilename());
        resume.setFileHash(fileHash);
        resume.setUploadedAt(Instant.now());
        resumeRepository.save(resume);

        // 5. บันทึกลง ResumeSkillEntity
        if (pythonResponse.getResume_data() != null && pythonResponse.getResume_data().getSkills() != null) {
            for (String skillName : pythonResponse.getResume_data().getSkills()) {
                ResumeSkillEntity skillEntity = new ResumeSkillEntity();
                skillEntity.setResumeEntity(resume);
                skillEntity.setSkillName(skillName);
                skillEntity.setSkillType("HARD"); // Default เป็น Hard Skill
                resumeSkillRepository.save(skillEntity);
            }
        }

        // 6. บันทึกคำถาม 5 ข้อลง AssessmentQuestionEntity
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
                }
                assessmentQuestionRepository.save(questionEntity);
            }
        }

        // 7. Return Response ไปให้ Frontend
        return ResumeUploadResponseDto.builder()
                .resumeId(resume.getId())
                .extractedSkills(pythonResponse.getResume_data().getSkills())
                .questions(pythonResponse.getQuestions())
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
        ResponseEntity<PythonResumeResponseDto> response = restTemplate.postForEntity(
                PYTHON_SERVICE_URL, requestEntity, PythonResumeResponseDto.class);

        return response.getBody();
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
}