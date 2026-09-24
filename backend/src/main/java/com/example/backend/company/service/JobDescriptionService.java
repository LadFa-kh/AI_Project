package com.example.backend.company.service;

import com.example.backend.company.dto.JobDescriptionResponseDto;
import com.example.backend.company.dto.JobPostRequestDto;
import com.example.backend.company.entity.CompanyEntity;
import com.example.backend.company.entity.JobDescriptionEntity;
import com.example.backend.company.entity.JobStatus;
import com.example.backend.company.repository.CompanyRepository;
import com.example.backend.handle.BusinessException;
import com.example.backend.handle.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.time.LocalDate;
import com.example.backend.company.repository.JobDescriptionRepository;
import com.example.backend.resume.repository.SoftwareSkillRepository;
import com.example.backend.user.entity.UserEntity;
import com.example.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
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
    private final CompanyRepository companyRepository;

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

        // B4: ผูกบริษัท — ใช้บริษัทของผู้ใช้ก่อน ถ้าไม่มีค่อยหา/สร้างจากชื่อที่ส่งมา
        CompanyEntity company = employer.getCompany();
        if (company == null && request.getCompanyName() != null && !request.getCompanyName().isBlank()) {
            company = findOrCreateCompanyByName(request.getCompanyName().trim());
        }
        if (company != null) {
            if (company.getStatus() == CompanyEntity.Status.SUSPENDED || company.getStatus() == CompanyEntity.Status.REJECTED) {
                throw BusinessException.forbidden("COMPANY_NOT_ACTIVE", "บริษัทนี้ถูกระงับหรือไม่ผ่านการอนุมัติ ไม่สามารถลงประกาศได้");
            }
            job.setCompany(company);
            if (job.getCompanyName() == null || job.getCompanyName().isBlank()) job.setCompanyName(company.getNameTh());
        }
        if (job.getCompanyName() == null || job.getCompanyName().isBlank()) {
            throw BusinessException.badRequest("COMPANY_REQUIRED", "ต้องระบุชื่อบริษัท หรือผูกบัญชีกับบริษัทก่อน");
        }

        // B3: สถานะ/วันเปิด-ปิด
        applyStatusAndDates(job, request.getStatus(), request.getOpenDate(), request.getCloseDate(), true);

        // 4. บันทึกลงฐานข้อมูล แล้วแปลงเป็น DTO ก่อน return
        JobDescriptionEntity saved = jobDescriptionRepository.save(job);
        return toResponseDto(saved);
    }

    /** นักศึกษา/บุคคลทั่วไปเห็นเฉพาะ OPEN (แถวเก่าที่ยังไม่มีสถานะนับเป็น OPEN) */
    @Transactional(readOnly = true)
    public List<JobDescriptionResponseDto> getAllJobDescriptions() {
        return getAllJobDescriptions(false);
    }

    @Transactional(readOnly = true)
    public List<JobDescriptionResponseDto> getAllJobDescriptions(boolean includeAllStatuses) {
        return jobDescriptionRepository.findAll().stream()
                .filter(j -> includeAllStatuses || isOpen(j))
                .map(this::toResponseDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public JobDescriptionResponseDto getJobDescriptionById(UUID id) {
        return getJobDescriptionById(id, true);
    }

    @Transactional(readOnly = true)
    public JobDescriptionResponseDto getJobDescriptionById(UUID id, boolean includeAllStatuses) {
        JobDescriptionEntity job = jobDescriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ไม่พบตำแหน่งงานที่ระบุ"));
        if (!includeAllStatuses && !isOpen(job)) {
            throw BusinessException.notFound("JOB_NOT_OPEN", "ประกาศนี้ปิดรับสมัครแล้วหรือยังไม่เปิด");
        }
        return toResponseDto(job);
    }



    public JobDescriptionResponseDto toResponseDto(JobDescriptionEntity job) {
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
                .companyId(job.getCompany() != null ? job.getCompany().getId() : null)
                .companyLogoUrl(job.getCompany() != null ? job.getCompany().getLogoUrl() : null)
                .postedBy(job.getEmployer() != null ? job.getEmployer().getId() : null)
                .status(job.getStatus() != null ? job.getStatus().name() : JobStatus.OPEN.name())
                .openDate(job.getOpenDate())
                .closeDate(job.getCloseDate())
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

    // ---------------------------------------------------------------
    // ส่วนของผู้ประกาศงาน (EMPLOYER)
    // ---------------------------------------------------------------
    // เมธอดชุดนี้ต่างจากชุดของผู้ดูแลระบบตรงที่ผูกกับรหัสผู้ประกาศที่ได้มาจาก
    // โทเคนเสมอ ไม่ได้รับมาจาก request body ผู้ประกาศจึงเห็นและแก้ไขได้เฉพาะ
    // ประกาศของตนเอง ปลอมรหัสของคนอื่นส่งเข้ามาไม่ได้

    public List<JobDescriptionResponseDto> getJobDescriptionsByEmployer(UUID employerId) {
        return jobDescriptionRepository.findByEmployer_Id(employerId).stream()
                .map(this::toResponseDto)
                .toList();
    }

    @Transactional
    public JobDescriptionResponseDto createJobDescriptionForEmployer(UUID employerId, JobPostRequestDto request) {
        request.setEmployerId(employerId);   // บังคับใช้เจ้าของจากโทเคน ทับค่าที่ส่งมา
        return createJobDescription(request);
    }

    @Transactional
    public JobDescriptionResponseDto updateJobDescriptionForEmployer(UUID employerId, UUID id, JobPostRequestDto request) {
        requireOwnership(employerId, id);
        return updateJobDescription(id, request);
    }

    @Transactional
    public void deleteJobDescriptionForEmployer(UUID employerId, UUID id) {
        requireOwnership(employerId, id);
        deleteJobDescription(id);
    }

    /**
     * ตรวจว่าประกาศงานนั้นเป็นของผู้ประกาศที่กำลังเรียกใช้จริงหรือไม่
     * ถ้าไม่ใช่ จะโยน AccessDeniedException ซึ่ง GlobalExceptionHandler ส่งต่อให้
     * Spring Security จัดการเป็นรหัสสถานะ 403 ตามเดิม
     */
    private void requireOwnership(UUID employerId, UUID jobId) {
        JobDescriptionEntity job = jobDescriptionRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("ไม่พบตำแหน่งงานที่ระบุ"));
        if (job.getEmployer() == null || !job.getEmployer().getId().equals(employerId)) {
            throw new AccessDeniedException("ไม่มีสิทธิ์จัดการประกาศงานของผู้อื่น");
        }
    }

    // =====================================================================
    // B3: สถานะประกาศงาน
    // =====================================================================

    public static boolean isOpen(JobDescriptionEntity j) {
        return j.getStatus() == null || j.getStatus() == JobStatus.OPEN;
    }

    private JobStatus parseStatus(String raw) {
        try {
            return JobStatus.valueOf(raw.trim().toUpperCase());
        } catch (Exception e) {
            throw BusinessException.badRequest("INVALID_STATUS", "สถานะต้องเป็น DRAFT, OPEN หรือ CLOSED");
        }
    }

    private void applyStatusAndDates(JobDescriptionEntity job, String rawStatus, LocalDate open, LocalDate close, boolean creating) {
        if (open != null) job.setOpenDate(open);
        if (close != null) job.setCloseDate(close);
        if (job.getOpenDate() != null && job.getCloseDate() != null && job.getCloseDate().isBefore(job.getOpenDate())) {
            throw BusinessException.badRequest("INVALID_DATE_RANGE", "วันปิดรับสมัครต้องไม่อยู่ก่อนวันเปิด");
        }
        LocalDate today = LocalDate.now();
        if (rawStatus != null && !rawStatus.isBlank()) {
            job.setStatus(parseStatus(rawStatus));
        } else if (creating) {
            // ไม่ระบุสถานะ: ถ้าวันเปิดอยู่ในอนาคต → DRAFT แล้วตัวตั้งเวลาจะเปิดให้เอง
            job.setStatus(job.getOpenDate() != null && job.getOpenDate().isAfter(today) ? JobStatus.DRAFT : JobStatus.OPEN);
        }
        if (job.getStatus() == JobStatus.OPEN && job.getCloseDate() != null && job.getCloseDate().isBefore(today)) {
            throw BusinessException.badRequest("ALREADY_EXPIRED", "วันปิดรับสมัครผ่านไปแล้ว ไม่สามารถเปิดประกาศได้");
        }
    }

    /** PATCH /jobs/{id}/status — เจ้าของประกาศ, คนในบริษัทเดียวกัน หรือ ADMIN */
    @Transactional
    public JobDescriptionResponseDto updateStatus(UserEntity actor, UUID jobId, String status, LocalDate open, LocalDate close) {
        JobDescriptionEntity job = jobDescriptionRepository.findById(jobId)
                .orElseThrow(() -> BusinessException.notFound("JOB_NOT_FOUND", "ไม่พบตำแหน่งงานที่ระบุ"));
        requireCanManage(actor, job);
        if ((status == null || status.isBlank()) && open == null && close == null) {
            throw BusinessException.badRequest("NOTHING_TO_UPDATE", "ต้องส่ง status หรือ openDate/closeDate อย่างน้อย 1 ค่า");
        }
        applyStatusAndDates(job, status, open, close, false);
        return toResponseDto(jobDescriptionRepository.save(job));
    }

    private void requireCanManage(UserEntity actor, JobDescriptionEntity job) {
        if (actor.getRole() == UserEntity.Role.ADMIN) return;
        boolean owner = job.getEmployer() != null && job.getEmployer().getId().equals(actor.getId());
        boolean sameCompany = actor.getCompany() != null && job.getCompany() != null
                && actor.getCompany().getId().equals(job.getCompany().getId());
        if (!owner && !sameCompany) {
            throw BusinessException.forbidden("NOT_JOB_OWNER", "ไม่มีสิทธิ์จัดการประกาศงานของผู้อื่น");
        }
    }

    /** เรียกโดยตัวตั้งเวลา: เปิด DRAFT ที่ถึงวันเปิด และปิด OPEN ที่เลยวันปิด */
    @Transactional
    public int[] runStatusSweep() {
        LocalDate today = LocalDate.now();
        List<JobDescriptionEntity> toOpen = jobDescriptionRepository.findByStatusAndOpenDateLessThanEqual(JobStatus.DRAFT, today)
                .stream().filter(j -> j.getCloseDate() == null || !j.getCloseDate().isBefore(today)).toList();
        toOpen.forEach(j -> j.setStatus(JobStatus.OPEN));
        List<JobDescriptionEntity> toClose = jobDescriptionRepository.findByStatusAndCloseDateBefore(JobStatus.OPEN, today);
        toClose.forEach(j -> j.setStatus(JobStatus.CLOSED));
        jobDescriptionRepository.saveAll(toOpen);
        jobDescriptionRepository.saveAll(toClose);
        return new int[]{toOpen.size(), toClose.size()};
    }

    // =====================================================================
    // B4: บริษัท
    // =====================================================================

    @Transactional
    public CompanyEntity findOrCreateCompanyByName(String name) {
        return companyRepository.findFirstByNameThIgnoreCase(name).orElseGet(() -> {
            CompanyEntity c = new CompanyEntity();
            c.setNameTh(name);
            c.setStatus(CompanyEntity.Status.ACTIVE);
            return companyRepository.save(c);
        });
    }

    @Transactional(readOnly = true)
    public List<JobDescriptionResponseDto> getJobsByCompany(UUID companyId, boolean includeAllStatuses) {
        return jobDescriptionRepository.findByCompany_Id(companyId).stream()
                .filter(j -> includeAllStatuses || isOpen(j))
                .map(this::toResponseDto)
                .toList();
    }

    // B10: แบ่งหน้า
    @Transactional(readOnly = true)
    public PageResponse<JobDescriptionResponseDto> searchJobs(String status, String q, int page, int size) {
        JobStatus st = (status == null || status.isBlank() || status.equalsIgnoreCase("ALL")) ? null : parseStatus(status);
        size = Math.max(1, Math.min(size, 100));
        var result = jobDescriptionRepository.search(st, (q == null || q.isBlank()) ? null : q.trim(),
                        PageRequest.of(Math.max(page, 0), size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toResponseDto);
        return PageResponse.of(result);
    }
}
