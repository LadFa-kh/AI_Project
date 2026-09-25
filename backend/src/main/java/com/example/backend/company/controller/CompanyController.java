package com.example.backend.company.controller;

import com.example.backend.company.dto.CompanyDto;
import com.example.backend.company.dto.JobDescriptionResponseDto;
import com.example.backend.company.service.CompanyService;
import com.example.backend.company.service.JobDescriptionService;
import com.example.backend.config.CurrentUserProvider;
import com.example.backend.handle.ApiResponse;
import com.example.backend.handle.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** B4: โปรไฟล์บริษัท — GET (รายชื่อ), /{id} และ /{id}/jobs เปิดสาธารณะ, /me ต้องล็อกอิน */
@RestController
@RequestMapping("/api/v1/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;
    private final JobDescriptionService jobDescriptionService;
    private final CurrentUserProvider currentUserProvider;

    /** รายชื่อบริษัท ACTIVE (สาธารณะ, แบ่งหน้า) — ?q=ค้นชื่อ&page=0&size=20 */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<CompanyDto>>> listPublic(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(new ApiResponse<>(200, "OK", companyService.publicList(q, page, size)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<CompanyDto>> getMine(Authentication auth) {
        return ResponseEntity.ok(new ApiResponse<>(200, "OK", companyService.getMine(currentUserProvider.getCurrentUser(auth))));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<CompanyDto>> updateMine(Authentication auth, @RequestBody CompanyDto req) {
        return ResponseEntity.ok(new ApiResponse<>(200, "บันทึกข้อมูลบริษัทแล้ว",
                companyService.upsertMine(currentUserProvider.getCurrentUser(auth), req)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CompanyDto>> getCompany(@PathVariable UUID id) {
        return ResponseEntity.ok(new ApiResponse<>(200, "OK", companyService.getPublic(id)));
    }

    @GetMapping("/{id}/jobs")
    public ResponseEntity<ApiResponse<List<JobDescriptionResponseDto>>> getCompanyJobs(@PathVariable UUID id) {
        companyService.getPublic(id); // 404 ถ้าบริษัทไม่ ACTIVE
        return ResponseEntity.ok(new ApiResponse<>(200, "OK", jobDescriptionService.getJobsByCompany(id, false)));
    }
}
