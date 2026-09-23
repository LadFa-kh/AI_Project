package com.example.backend.internship;

import com.example.backend.company.entity.CompanyEntity;
import com.example.backend.company.entity.JobDescriptionEntity;
import com.example.backend.company.repository.CompanyRepository;
import com.example.backend.company.repository.JobDescriptionRepository;
import com.example.backend.handle.BusinessException;
import com.example.backend.handle.PageResponse;
import com.example.backend.user.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * B6: สิทธิ์
 *   นักศึกษา → เพิ่ม/แก้/ลบ ของตัวเอง (ลบได้เฉพาะสถานะ APPLIED/CANCELLED)
 *   ผู้ประกาศงาน → ดูของบริษัทตัวเอง เปลี่ยนสถานะ + เขียน companyNote
 *   ADMIN → ดูทั้งหมดแบบแบ่งหน้า
 */
@Service
@RequiredArgsConstructor
public class InternshipService {

    private final InternshipRecordRepository repository;
    private final CompanyRepository companyRepository;
    private final JobDescriptionRepository jobRepository;

    // ----- นักศึกษา -----

    @Transactional(readOnly = true)
    public List<InternshipDto> mine(UserEntity student) {
        return repository.findByStudent_IdOrderByCreatedAtDesc(student.getId()).stream().map(this::toDto).toList();
    }

    @Transactional
    public InternshipDto create(UserEntity student, InternshipDto req) {
        if (student.getRole() != UserEntity.Role.STUDENT && student.getRole() != UserEntity.Role.ADMIN) {
            throw BusinessException.forbidden("NOT_STUDENT", "เฉพาะนักศึกษาเท่านั้นที่บันทึกการฝึกงานได้");
        }
        InternshipRecordEntity r = new InternshipRecordEntity();
        r.setStudent(student);
        applyStudentFields(r, req, true);
        return toDto(repository.save(r));
    }

    @Transactional
    public InternshipDto update(UserEntity student, UUID id, InternshipDto req) {
        InternshipRecordEntity r = requireOwn(student, id);
        applyStudentFields(r, req, false);
        return toDto(repository.save(r));
    }

    @Transactional
    public void delete(UserEntity student, UUID id) {
        InternshipRecordEntity r = requireOwn(student, id);
        if (r.getStatus() != InternshipRecordEntity.Status.APPLIED && r.getStatus() != InternshipRecordEntity.Status.CANCELLED) {
            throw BusinessException.conflict("INTERNSHIP_LOCKED", "ลบได้เฉพาะรายการที่ยังไม่ได้รับการตอบรับ หรือยกเลิกแล้ว");
        }
        repository.delete(r);
    }

    // ----- ผู้ประกาศงาน -----

    @Transactional(readOnly = true)
    public List<InternshipDto> ofMyCompany(UserEntity employer) {
        if (employer.getCompany() == null) throw BusinessException.notFound("NO_COMPANY", "บัญชีนี้ยังไม่ได้ผูกกับบริษัท");
        return repository.findByCompany_IdOrderByCreatedAtDesc(employer.getCompany().getId()).stream().map(this::toDto).toList();
    }

    /** body: {"status":"ACCEPTED","companyNote":"..."} */
    @Transactional
    public InternshipDto employerUpdate(UserEntity employer, UUID id, String status, String companyNote) {
        InternshipRecordEntity r = repository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("INTERNSHIP_NOT_FOUND", "ไม่พบรายการฝึกงาน"));
        boolean admin = employer.getRole() == UserEntity.Role.ADMIN;
        if (!admin && (employer.getCompany() == null || r.getCompany() == null
                || !employer.getCompany().getId().equals(r.getCompany().getId()))) {
            throw BusinessException.forbidden("NOT_YOUR_COMPANY", "รายการนี้ไม่ใช่ของบริษัทคุณ");
        }
        if (status != null && !status.isBlank()) r.setStatus(parse(status));
        if (companyNote != null) r.setCompanyNote(companyNote);
        return toDto(repository.save(r));
    }

    // ----- ADMIN -----

    @Transactional(readOnly = true)
    public PageResponse<InternshipDto> adminSearch(String status, UUID companyId, int page, int size) {
        InternshipRecordEntity.Status st = status == null || status.isBlank() || status.equalsIgnoreCase("ALL") ? null : parse(status);
        var p = repository.search(st, companyId, PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)),
                Sort.by(Sort.Direction.DESC, "createdAt")));
        return PageResponse.of(p.map(this::toDto));
    }

    // ----- helpers -----

    private InternshipRecordEntity requireOwn(UserEntity student, UUID id) {
        InternshipRecordEntity r = repository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("INTERNSHIP_NOT_FOUND", "ไม่พบรายการฝึกงาน"));
        if (!r.getStudent().getId().equals(student.getId())) {
            throw BusinessException.forbidden("NOT_OWNER", "ไม่ใช่รายการของคุณ");
        }
        return r;
    }

    private void applyStudentFields(InternshipRecordEntity r, InternshipDto q, boolean creating) {
        if (q.getJobId() != null) {
            JobDescriptionEntity job = jobRepository.findById(q.getJobId())
                    .orElseThrow(() -> BusinessException.notFound("JOB_NOT_FOUND", "ไม่พบประกาศงาน"));
            r.setJob(job);
            if (job.getCompany() != null) r.setCompany(job.getCompany());
            if (r.getPositionName() == null) r.setPositionName(job.getPositionName());
        }
        if (q.getCompanyId() != null) {
            CompanyEntity c = companyRepository.findById(q.getCompanyId())
                    .orElseThrow(() -> BusinessException.notFound("COMPANY_NOT_FOUND", "ไม่พบบริษัท"));
            r.setCompany(c);
        }
        if (q.getCompanyName() != null && r.getCompany() == null) r.setCompanyNameText(q.getCompanyName().trim());
        if (q.getPositionName() != null) r.setPositionName(q.getPositionName().trim());
        if (q.getStartDate() != null) r.setStartDate(q.getStartDate());
        if (q.getEndDate() != null) r.setEndDate(q.getEndDate());
        if (q.getSupervisorName() != null) r.setSupervisorName(q.getSupervisorName());
        if (q.getSupervisorEmail() != null) r.setSupervisorEmail(q.getSupervisorEmail());
        if (q.getStudentNote() != null) r.setStudentNote(q.getStudentNote());
        // นักศึกษาเปลี่ยนสถานะได้เองแค่ "ยกเลิก" หรือบันทึกย้อนหลังว่า "ฝึกเสร็จแล้ว" สำหรับบริษัทนอกระบบ
        if (q.getStatus() != null && !q.getStatus().isBlank()) {
            InternshipRecordEntity.Status s = parse(q.getStatus());
            boolean external = r.getCompany() == null;
            if (s == InternshipRecordEntity.Status.CANCELLED || external || (creating && s == InternshipRecordEntity.Status.APPLIED)) {
                r.setStatus(s);
            } else {
                throw BusinessException.forbidden("STATUS_BY_COMPANY", "สถานะนี้ต้องให้บริษัทเป็นผู้อัปเดต");
            }
        }
        if (r.getCompany() == null && (r.getCompanyNameText() == null || r.getCompanyNameText().isBlank())) {
            throw BusinessException.badRequest("COMPANY_REQUIRED", "ต้องระบุ companyId, jobId หรือ companyName");
        }
        if (r.getStartDate() != null && r.getEndDate() != null && r.getEndDate().isBefore(r.getStartDate())) {
            throw BusinessException.badRequest("INVALID_DATE_RANGE", "วันสิ้นสุดต้องไม่อยู่ก่อนวันเริ่ม");
        }
    }

    private InternshipRecordEntity.Status parse(String s) {
        try { return InternshipRecordEntity.Status.valueOf(s.trim().toUpperCase()); }
        catch (Exception e) {
            throw BusinessException.badRequest("INVALID_STATUS",
                    "สถานะต้องเป็น APPLIED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED หรือ REJECTED");
        }
    }

    InternshipDto toDto(InternshipRecordEntity r) {
        return InternshipDto.builder()
                .id(r.getId())
                .studentId(r.getStudent().getId())
                .studentName(r.getStudent().getFullName())
                .studentEmail(r.getStudent().getEmail())
                .companyId(r.getCompany() == null ? null : r.getCompany().getId())
                .companyName(r.getCompany() != null ? r.getCompany().getNameTh() : r.getCompanyNameText())
                .jobId(r.getJob() == null ? null : r.getJob().getId())
                .positionName(r.getPositionName())
                .startDate(r.getStartDate()).endDate(r.getEndDate())
                .status(r.getStatus().name())
                .supervisorName(r.getSupervisorName()).supervisorEmail(r.getSupervisorEmail())
                .studentNote(r.getStudentNote()).companyNote(r.getCompanyNote())
                .createdAt(r.getCreatedAt()).updatedAt(r.getUpdatedAt())
                .build();
    }
}
