package com.example.backend.company.service;

import com.example.backend.company.dto.JobPostRequestDto;
import com.example.backend.company.entity.JobDescriptionEntity;
import com.example.backend.company.repository.JobDescriptionRepository;
import com.example.backend.resume.repository.SoftwareSkillRepository;
import com.example.backend.user.entity.UserEntity;
import com.example.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobDescriptionService {

    private final JobDescriptionRepository jobDescriptionRepository;
    private final UserRepository userRepository;
    private final SoftwareSkillRepository softwareSkillRepository;

    @Transactional
    public JobDescriptionEntity createJobDescription(JobPostRequestDto request) {
        // 1. ค้นหา User ที่เป็น Employer
        UserEntity employer = userRepository.findById(request.getEmployerId())
                .orElseThrow(() -> new RuntimeException("Employer not found"));

        // 2. [NEW] เช็คว่า skill ทุกตัวที่เลือกมามีอยู่จริงใน taxonomy
        List<String> requestedSkills = request.getRequiredSkills();
        if (requestedSkills == null || requestedSkills.isEmpty()) {
            throw new IllegalArgumentException("ต้องระบุ required skills อย่างน้อย 1 รายการ");
        }

        List<String> validSkills = softwareSkillRepository.findValidSkillNames(requestedSkills);
        List<String> invalidSkills = requestedSkills.stream()
                .filter(s -> !validSkills.contains(s))
                .toList();

        if (!invalidSkills.isEmpty()) {
            throw new IllegalArgumentException("พบ skill ที่ไม่อยู่ในระบบ: " + String.join(", ", invalidSkills));
        }

        // 3. Map ข้อมูลลง Entity
        JobDescriptionEntity job = new JobDescriptionEntity();
        job.setEmployer(employer);
        job.setCompanyName(request.getCompanyName());
        job.setJobType(request.getJobType());
        job.setPositionName(request.getPositionName());
        job.setRequiredSkills(String.join(",", requestedSkills));

        // 4. บันทึกลงฐานข้อมูล
        return jobDescriptionRepository.save(job);
    }
}