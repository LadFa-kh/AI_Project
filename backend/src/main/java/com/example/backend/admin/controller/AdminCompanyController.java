package com.example.backend.admin.controller;

import com.example.backend.company.dto.CompanyDto;
import com.example.backend.company.service.CompanyService;
import com.example.backend.handle.ApiResponse;
import com.example.backend.handle.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/** B4: ADMIN จัดการบริษัท (SecurityConfig บังคับ ROLE_ADMIN กับ /api/v1/admin/** อยู่แล้ว) */
@RestController
@RequestMapping("/api/v1/admin/companies")
@RequiredArgsConstructor
public class AdminCompanyController {

    private final CompanyService companyService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<CompanyDto>>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(new ApiResponse<>(200, "OK", companyService.adminList(status, q, page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CompanyDto>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(new ApiResponse<>(200, "OK", companyService.adminGet(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CompanyDto>> create(@RequestBody CompanyDto req) {
        return ResponseEntity.status(201).body(new ApiResponse<>(201, "สร้างบริษัทแล้ว", companyService.adminCreate(req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CompanyDto>> update(@PathVariable UUID id, @RequestBody CompanyDto req) {
        return ResponseEntity.ok(new ApiResponse<>(200, "แก้ไขบริษัทแล้ว", companyService.adminUpdate(id, req)));
    }

    /** body: {"status":"ACTIVE|SUSPENDED|REJECTED|PENDING","reason":"..."} */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<CompanyDto>> setStatus(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(new ApiResponse<>(200, "เปลี่ยนสถานะแล้ว",
                companyService.adminSetStatus(id, body.get("status"), body.get("reason"))));
    }

    @PostMapping("/{id}/users/{userId}")
    public ResponseEntity<ApiResponse<Void>> assignUser(@PathVariable UUID id, @PathVariable UUID userId) {
        companyService.adminAssignUser(id, userId);
        return ResponseEntity.ok(new ApiResponse<>(200, "ผูกผู้ใช้กับบริษัทแล้ว", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        companyService.adminDelete(id);
        return ResponseEntity.ok(new ApiResponse<>(200, "ลบบริษัทแล้ว", null));
    }
}
