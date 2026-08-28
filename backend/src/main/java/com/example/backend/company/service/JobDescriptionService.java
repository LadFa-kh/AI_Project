package com.example.backend.company.service;

import com.example.backend.company.dto.JobDescriptionResponseDto;
import com.example.backend.company.dto.JobPostRequestDto;
import com.example.backend.company.entity.JobDescriptionEntity;
import com.example.backend.company.repository.JobDescriptionRepository;
import com.example.backend.resume.repository.SoftwareSkillRepository;
import com.example.backend.user.entity.UserEntity;
import com.example.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JobDescriptionService {

    private final JobDescriptionRepository jobDescriptionRepository;
    private final UserRepository userRepository;
    private final SoftwareSkillRepository softwareSkillRepository;

    @Transactional
    public JobDescriptionResponseDto createJobDescription(JobPostRequestDto request) {
        // 1. Parse comma-separated string เป็น List ก่อน validate
        String rawSkills = request.getRequiredSkills();
        if (rawSkills == null || rawSkills.isBlank()) {
            throw new IllegalArgumentException("ต้องระบุ required skills อย่างน้อย 1 รายการ");
        }

        List<String> requestedSkills = Arrays.stream(rawSkills.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .toList();

        if (requestedSkills.isEmpty()) {
            throw new IllegalArgumentException("ต้องระบุ required skills อย่างน้อย 1 รายการ");
        }

        List<String> validSkills = softwareSkillRepository.findValidSkillNames(requestedSkills);
        List<String> invalidSkills = requestedSkills.stream()
                .filter(s -> !validSkills.contains(s))
                .toList();

        if (!invalidSkills.isEmpty()) {
            throw new IllegalArgumentException("พบ skill ที่ไม่อยู่ในระบบ: " + String.join(", ", invalidSkills));
        }

        // 2. ค้นหา User ที่เป็น Employer (ตรวจ null ก่อน เพื่อไม่ให้ Spring Data โยน InvalidDataAccessApiUsageException)
        if (request.getEmployerId() == null) {
            throw new IllegalArgumentException("ต้องระบุรหัสผู้ประกาศงาน (employerId)");
        }
        UserEntity employer = userRepository.findById(request.getEmployerId())
                .orElseThrow(() -> new IllegalArgumentException("ไม่พบผู้ประกาศงานที่ระบุ"));

        // 3. Map ข้อมูลลง Entity
        JobDescriptionEntity job = new JobDescriptionEntity();
        job.setEmployer(employer);
        job.setCompanyName(request.getCompanyName());
        job.setJobType(request.getJobType());
        job.setPositionName(request.getPositionName());
        job.setRequiredSkills(String.join(",", requestedSkills));
        job.setJobDescription(request.getJobDescription());
        job.setDuration(request.getDuration());
        job.setSalary(request.getSalary());
        job.setContactLink(request.getContactLink());

        // 4. บันทึกลงฐานข้อมูล แล้วแปลงเป็น DTO ก่อน return
        JobDescriptionEntity saved = jobDescriptionRepository.save(job);
        return toResponseDto(saved);
    }

    public List<JobDescriptionResponseDto> getAllJobDescriptions() {
        return jobDescriptionRepository.findAll().stream()
                .map(this::toResponseDto)
                .toList();
    }

    public JobDescriptionResponseDto getJobDescriptionById(UUID id) {
        JobDescriptionEntity job = jobDescriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ไม่พบตำแหน่งงานที่ระบุ"));
        return toResponseDto(job);
    }



    private JobDescriptionResponseDto toResponseDto(JobDescriptionEntity job) {
        List<String> skills = job.getRequiredSkills() == null || job.getRequiredSkills().isBlank()
                ? List.of()
                : Arrays.stream(job.getRequiredSkills().split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        return JobDescriptionResponseDto.builder()
                .id(job.getId())
                .companyName(job.getCompanyName())
                .jobType(job.getJobType())
                .positionName(job.getPositionName())
                .requiredSkills(skills)
                .jobDescription(job.getJobDescription())
                .duration(job.getDuration())
                .salary(job.getSalary())
                .contactLink(job.getContactLink())
                .build();
    }

    @Transactional
    public JobDescriptionResponseDto updateJobDescription(UUID id, JobPostRequestDto request) {
        JobDescriptionEntity job = jobDescriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ไม่พบตำแหน่งงานที่ระบุ"));

        if (request.getCompanyName() != null && !request.getCompanyName().isBlank()) {
            job.setCompanyName(request.getCompanyName().trim());
        }
        if (request.getJobType() != null && !request.getJobType().isBlank()) {
            job.setJobType(request.getJobType().trim());
        }
        if (request.getPositionName() != null && !request.getPositionName().isBlank()) {
            job.setPositionName(request.getPositionName().trim());
        }
        if (request.getJobDescription() != null) {
            job.setJobDescription(request.getJobDescription());
        }
        if (request.getDuration() != null) {
            job.setDuration(request.getDuration());
        }
        if (request.getSalary() != null) {
            job.setSalary(request.getSalary());
        }
        if (request.getContactLink() != null) {
            job.setContactLink(request.getContactLink());
        }

        // ถ้าส่ง requiredSkills มา ต้อง validate กับ taxonomy เหมือนตอนสร้างใหม่
        if (request.getRequiredSkills() != null && !request.getRequiredSkills().isBlank()) {
            List<String> requestedSkills = Arrays.stream(request.getRequiredSkills().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .distinct()
                    .toList();

            List<String> validSkills = softwareSkillRepository.findValidSkillNames(requestedSkills);
            List<String> invalidSkills = requestedSkills.stream()
                    .filter(s -> !validSkills.contains(s))
                    .toList();

            if (!invalidSkills.isEmpty()) {
                throw new IllegalArgumentException("พบ skill ที่ไม่อยู่ในระบบ: " + String.join(", ", invalidSkills));
            }

            job.setRequiredSkills(String.join(",", requestedSkills));
        }

        return toResponseDto(jobDescriptionRepository.save(job));
    }

    @Transactional
    public void deleteJobDescription(UUID id) {
        JobDescriptionEntity job = jobDescriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ไม่พบตำแหน่งงานที่ระบุ"));
        jobDescriptionRepository.delete(job);
    }
}