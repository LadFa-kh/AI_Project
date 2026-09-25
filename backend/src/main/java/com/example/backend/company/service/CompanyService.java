package com.example.backend.company.service;

import com.example.backend.company.dto.CompanyDto;
import com.example.backend.company.entity.CompanyEntity;
import com.example.backend.company.repository.CompanyRepository;
import com.example.backend.company.repository.JobDescriptionRepository;
import com.example.backend.handle.BusinessException;
import com.example.backend.handle.PageResponse;
import com.example.backend.user.entity.UserEntity;
import com.example.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final JobDescriptionRepository jobDescriptionRepository;
    private final UserRepository userRepository;

    public CompanyEntity require(UUID id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("COMPANY_NOT_FOUND", "ไม่พบบริษัทที่ระบุ"));
    }

    /** หน้าโปรไฟล์บริษัทสาธารณะ — แสดงเฉพาะบริษัท ACTIVE (ADMIN ดูได้ทุกสถานะผ่าน /admin) */
    @Transactional(readOnly = true)
    public CompanyDto getPublic(UUID id) {
        CompanyEntity c = require(id);
        if (c.getStatus() != CompanyEntity.Status.ACTIVE) {
            throw BusinessException.notFound("COMPANY_NOT_FOUND", "ไม่พบบริษัทที่ระบุ");
        }
        CompanyDto dto = toDto(c);
        dto.setTaxId(null);          // ไม่เปิดเผยเลขผู้เสียภาษีต่อสาธารณะ
        dto.setRejectReason(null);
        return dto;
    }

    @Transactional(readOnly = true)
    public CompanyDto getMine(UserEntity user) {
        if (user.getCompany() == null) {
            throw BusinessException.notFound("NO_COMPANY", "บัญชีนี้ยังไม่ได้ผูกกับบริษัท");
        }
        return toDto(user.getCompany());
    }

    /** PUT /companies/me — ถ้ายังไม่มีบริษัท จะสร้างใหม่และผูกกับผู้ใช้ */
    @Transactional
    public CompanyDto upsertMine(UserEntity user, CompanyDto req) {
        if (user.getRole() != UserEntity.Role.EMPLOYER && user.getRole() != UserEntity.Role.ADMIN) {
            throw BusinessException.forbidden("NOT_EMPLOYER", "เฉพาะผู้ประกาศงานเท่านั้น");
        }
        CompanyEntity c = user.getCompany();
        if (c == null) {
            if (req.getNameTh() == null || req.getNameTh().isBlank()) {
                throw BusinessException.badRequest("NAME_TH_REQUIRED", "ต้องระบุชื่อบริษัทภาษาไทย (nameTh)");
            }
            c = new CompanyEntity();
            c.setStatus(CompanyEntity.Status.ACTIVE);
        }
        apply(c, req, false);
        c = companyRepository.save(c);
        if (user.getCompany() == null) {
            user.setCompany(c);
            userRepository.save(user);
        }
        return toDto(c);
    }

    // ===== ADMIN =====

    @Transactional(readOnly = true)
    public PageResponse<CompanyDto> adminList(String status, String q, int page, int size) {
        CompanyEntity.Status st = parseStatusOrNull(status);
        var p = companyRepository.search(st, (q == null || q.isBlank()) ? null : q.trim(),
                PageRequest.of(Math.max(page, 0), Math.max(1, Math.min(size, 100)), Sort.by("nameTh")));
        return PageResponse.of(p.map(this::toDto));
    }

    /** GET /companies (สาธารณะ) — เฉพาะบริษัท ACTIVE เรียงตามชื่อ ไม่เปิดเผยเลขผู้เสียภาษี */
    @Transactional(readOnly = true)
    public PageResponse<CompanyDto> publicList(String q, int page, int size) {
        var p = companyRepository.search(CompanyEntity.Status.ACTIVE, (q == null || q.isBlank()) ? null : q.trim(),
                PageRequest.of(Math.max(page, 0), Math.max(1, Math.min(size, 100)), Sort.by("nameTh")));
        return PageResponse.of(p.map(c -> {
            CompanyDto dto = toDto(c);
            dto.setTaxId(null);
            dto.setRejectReason(null);
            return dto;
        }));
    }

    @Transactional(readOnly = true)
    public CompanyDto adminGet(UUID id) { return toDto(require(id)); }

    @Transactional
    public CompanyDto adminCreate(CompanyDto req) {
        if (req.getNameTh() == null || req.getNameTh().isBlank()) {
            throw BusinessException.badRequest("NAME_TH_REQUIRED", "ต้องระบุชื่อบริษัทภาษาไทย (nameTh)");
        }
        CompanyEntity c = new CompanyEntity();
        apply(c, req, true);
        if (c.getStatus() == null) c.setStatus(CompanyEntity.Status.ACTIVE);
        return toDto(companyRepository.save(c));
    }

    @Transactional
    public CompanyDto adminUpdate(UUID id, CompanyDto req) {
        CompanyEntity c = require(id);
        apply(c, req, true);
        return toDto(companyRepository.save(c));
    }

    @Transactional
    public CompanyDto adminSetStatus(UUID id, String status, String reason) {
        CompanyEntity c = require(id);
        CompanyEntity.Status st = parseStatusOrNull(status);
        if (st == null) throw BusinessException.badRequest("INVALID_STATUS", "สถานะไม่ถูกต้อง");
        c.setStatus(st);
        c.setRejectReason(st == CompanyEntity.Status.REJECTED || st == CompanyEntity.Status.SUSPENDED ? reason : null);
        return toDto(companyRepository.save(c));
    }

    @Transactional
    public void adminDelete(UUID id) {
        CompanyEntity c = require(id);
        if (jobDescriptionRepository.countByCompany_Id(id) > 0) {
            throw BusinessException.conflict("COMPANY_HAS_JOBS", "บริษัทนี้ยังมีประกาศงานอยู่ ให้ใช้การระงับ (SUSPENDED) แทนการลบ");
        }
        userRepository.findAll().stream()
                .filter(u -> u.getCompany() != null && u.getCompany().getId().equals(id))
                .forEach(u -> { u.setCompany(null); userRepository.save(u); });
        companyRepository.delete(c);
    }

    /** ผูกผู้ใช้ EMPLOYER เข้ากับบริษัท */
    @Transactional
    public void adminAssignUser(UUID companyId, UUID userId) {
        CompanyEntity c = require(companyId);
        UserEntity u = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("USER_NOT_FOUND", "ไม่พบผู้ใช้"));
        u.setCompany(c);
        userRepository.save(u);
    }

    // ===== helpers =====

    private CompanyEntity.Status parseStatusOrNull(String s) {
        if (s == null || s.isBlank() || s.equalsIgnoreCase("ALL")) return null;
        try { return CompanyEntity.Status.valueOf(s.trim().toUpperCase()); }
        catch (Exception e) { throw BusinessException.badRequest("INVALID_STATUS", "สถานะบริษัทไม่ถูกต้อง"); }
    }

    private void apply(CompanyEntity c, CompanyDto r, boolean admin) {
        if (r.getNameTh() != null && !r.getNameTh().isBlank()) c.setNameTh(r.getNameTh().trim());
        if (r.getNameEn() != null) c.setNameEn(blankToNull(r.getNameEn()));
        if (r.getTaxId() != null) {
            String tax = blankToNull(r.getTaxId());
            if (tax != null) {
                companyRepository.findByTaxId(tax).filter(o -> !o.getId().equals(c.getId())).ifPresent(o -> {
                    throw BusinessException.conflict("TAX_ID_DUPLICATE", "เลขผู้เสียภาษีนี้ถูกใช้โดยบริษัทอื่นแล้ว");
                });
            }
            c.setTaxId(tax);
        }
        if (r.getIndustry() != null) c.setIndustry(blankToNull(r.getIndustry()));
        if (r.getDescription() != null) c.setDescription(r.getDescription());
        if (r.getLogoUrl() != null) c.setLogoUrl(blankToNull(r.getLogoUrl()));
        if (r.getWebsite() != null) c.setWebsite(blankToNull(r.getWebsite()));
        if (r.getEmail() != null) c.setEmail(blankToNull(r.getEmail()));
        if (r.getPhone() != null) c.setPhone(blankToNull(r.getPhone()));
        if (r.getAddress() != null) c.setAddress(r.getAddress());
        if (r.getProvince() != null) c.setProvince(blankToNull(r.getProvince()));
        if (admin && r.getStatus() != null) c.setStatus(parseStatusOrNull(r.getStatus()));
    }

    private static String blankToNull(String s) { return s == null || s.isBlank() ? null : s.trim(); }

    public CompanyDto toDto(CompanyEntity c) {
        return CompanyDto.builder()
                .id(c.getId()).nameTh(c.getNameTh()).nameEn(c.getNameEn()).taxId(c.getTaxId())
                .industry(c.getIndustry()).description(c.getDescription()).logoUrl(c.getLogoUrl())
                .website(c.getWebsite()).email(c.getEmail()).phone(c.getPhone()).address(c.getAddress())
                .province(c.getProvince()).status(c.getStatus() != null ? c.getStatus().name() : null)
                .rejectReason(c.getRejectReason())
                .jobCount(c.getId() != null ? jobDescriptionRepository.countByCompany_Id(c.getId()) : 0L)
                .createdAt(c.getCreatedAt()).updatedAt(c.getUpdatedAt())
                .build();
    }
}
