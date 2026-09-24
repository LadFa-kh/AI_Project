package com.example.backend.internship;

import com.example.backend.config.CurrentUserProvider;
import com.example.backend.handle.ApiResponse;
import com.example.backend.handle.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * B6 endpoints
 *   นักศึกษา:  GET/POST /api/v1/internships/me, PUT/DELETE /api/v1/internships/me/{id}
 *   บริษัท:    GET /api/v1/employer/internships, PATCH /api/v1/employer/internships/{id}
 *   ADMIN:     GET /api/v1/admin/internships?status=&companyId=&page=&size=
 */
@RestController
@RequiredArgsConstructor
public class InternshipController {

    private final InternshipService service;
    private final CurrentUserProvider currentUser;

    @GetMapping("/api/v1/internships/me")
    public ResponseEntity<ApiResponse<List<InternshipDto>>> mine(Authentication auth) {
        return ResponseEntity.ok(new ApiResponse<>(200, "OK", service.mine(currentUser.getCurrentUser(auth))));
    }

    @PostMapping("/api/v1/internships/me")
    public ResponseEntity<ApiResponse<InternshipDto>> create(Authentication auth, @RequestBody InternshipDto req) {
        return ResponseEntity.status(201).body(new ApiResponse<>(201, "บันทึกการฝึกงานแล้ว",
                service.create(currentUser.getCurrentUser(auth), req)));
    }

    @PutMapping("/api/v1/internships/me/{id}")
    public ResponseEntity<ApiResponse<InternshipDto>> update(Authentication auth, @PathVariable UUID id, @RequestBody InternshipDto req) {
        return ResponseEntity.ok(new ApiResponse<>(200, "แก้ไขแล้ว", service.update(currentUser.getCurrentUser(auth), id, req)));
    }

    @DeleteMapping("/api/v1/internships/me/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(Authentication auth, @PathVariable UUID id) {
        service.delete(currentUser.getCurrentUser(auth), id);
        return ResponseEntity.ok(new ApiResponse<>(200, "ลบแล้ว", null));
    }

    @GetMapping("/api/v1/employer/internships")
    public ResponseEntity<ApiResponse<List<InternshipDto>>> ofCompany(Authentication auth) {
        return ResponseEntity.ok(new ApiResponse<>(200, "OK", service.ofMyCompany(currentUser.getCurrentUser(auth))));
    }

    @PatchMapping("/api/v1/employer/internships/{id}")
    public ResponseEntity<ApiResponse<InternshipDto>> employerUpdate(Authentication auth, @PathVariable UUID id,
                                                                     @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(new ApiResponse<>(200, "อัปเดตแล้ว", service.employerUpdate(
                currentUser.getCurrentUser(auth), id, body.get("status"), body.get("companyNote"))));
    }

    @GetMapping("/api/v1/admin/internships")
    public ResponseEntity<ApiResponse<PageResponse<InternshipDto>>> admin(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID companyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(new ApiResponse<>(200, "OK", service.adminSearch(status, companyId, page, size)));
    }
}
