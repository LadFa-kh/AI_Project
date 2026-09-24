package com.example.backend.admin.controller;

import com.example.backend.company.entity.CompanyEntity;
import com.example.backend.company.repository.CompanyRepository;
import com.example.backend.handle.ApiResponse;
import com.example.backend.handle.BusinessException;
import com.example.backend.user.entity.UserEntity;
import com.example.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/** B5: ADMIN อนุมัติ/ปฏิเสธ ผู้ประกาศงานที่สมัครเอง */
@RestController
@RequestMapping("/api/v1/admin/employers")
@RequiredArgsConstructor
public class AdminEmployerController {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;

    /** ?status=PENDING (ค่าเริ่มต้น) | ACTIVE | REJECTED | SUSPENDED | ALL */
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> list(@RequestParam(defaultValue = "PENDING") String status) {
        List<Map<String, Object>> out = userRepository.findByRole(UserEntity.Role.EMPLOYER).stream()
                .filter(u -> status.equalsIgnoreCase("ALL") || u.effectiveStatus().name().equalsIgnoreCase(status))
                .sorted(Comparator.comparing(UserEntity::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toMap).toList();
        return ResponseEntity.ok(new ApiResponse<>(200, "OK", out));
    }

    @PostMapping("/{userId}/approve")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> approve(@PathVariable UUID userId) {
        UserEntity u = requireEmployer(userId);
        u.setAccountStatus(UserEntity.AccountStatus.ACTIVE);
        u.setStatusReason(null);
        CompanyEntity c = u.getCompany();
        if (c != null && c.getStatus() != CompanyEntity.Status.ACTIVE) {
            c.setStatus(CompanyEntity.Status.ACTIVE);
            c.setRejectReason(null);
            companyRepository.save(c);
        }
        userRepository.save(u);
        return ResponseEntity.ok(new ApiResponse<>(200, "อนุมัติผู้ประกาศงานแล้ว", toMap(u)));
    }

    /** body: {"reason":"..."} */
    @PostMapping("/{userId}/reject")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> reject(@PathVariable UUID userId,
                                                                   @RequestBody(required = false) Map<String, String> body) {
        UserEntity u = requireEmployer(userId);
        String reason = body == null ? null : body.get("reason");
        u.setAccountStatus(UserEntity.AccountStatus.REJECTED);
        u.setStatusReason(reason);
        CompanyEntity c = u.getCompany();
        // ปฏิเสธบริษัทด้วย ถ้าบริษัทนี้ยังรออนุมัติและไม่มีผู้ใช้ ACTIVE คนอื่น
        if (c != null && c.getStatus() == CompanyEntity.Status.PENDING) {
            c.setStatus(CompanyEntity.Status.REJECTED);
            c.setRejectReason(reason);
            companyRepository.save(c);
        }
        userRepository.save(u);
        return ResponseEntity.ok(new ApiResponse<>(200, "ปฏิเสธผู้ประกาศงานแล้ว", toMap(u)));
    }

    /** ระงับ/ปลดระงับบัญชี (ใช้ได้ทุก role ยกเว้น ADMIN) body: {"suspended":true,"reason":"..."} */
    @PostMapping("/{userId}/suspend")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> suspend(@PathVariable UUID userId,
                                                                    @RequestBody Map<String, Object> body) {
        UserEntity u = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("USER_NOT_FOUND", "ไม่พบผู้ใช้"));
        if (u.getRole() == UserEntity.Role.ADMIN) throw BusinessException.forbidden("CANNOT_SUSPEND_ADMIN", "ระงับผู้ดูแลระบบไม่ได้");
        boolean suspended = Boolean.TRUE.equals(body.get("suspended"));
        u.setAccountStatus(suspended ? UserEntity.AccountStatus.SUSPENDED : UserEntity.AccountStatus.ACTIVE);
        u.setStatusReason(suspended ? (String) body.get("reason") : null);
        userRepository.save(u);
        return ResponseEntity.ok(new ApiResponse<>(200, suspended ? "ระงับบัญชีแล้ว" : "ปลดระงับแล้ว", toMap(u)));
    }

    private UserEntity requireEmployer(UUID id) {
        UserEntity u = userRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("USER_NOT_FOUND", "ไม่พบผู้ใช้"));
        if (u.getRole() != UserEntity.Role.EMPLOYER) {
            throw BusinessException.badRequest("NOT_EMPLOYER", "ผู้ใช้นี้ไม่ใช่ผู้ประกาศงาน");
        }
        return u;
    }

    private Map<String, Object> toMap(UserEntity u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("userId", u.getId());
        m.put("email", u.getEmail());
        m.put("fullName", u.getFullName());
        m.put("telephone", u.getTelephone());
        m.put("accountStatus", u.effectiveStatus().name());
        m.put("statusReason", u.getStatusReason());
        m.put("createdAt", u.getCreatedAt());
        if (u.getCompany() != null) {
            m.put("companyId", u.getCompany().getId());
            m.put("companyName", u.getCompany().getNameTh());
            m.put("companyTaxId", u.getCompany().getTaxId());
            m.put("companyStatus", u.getCompany().getStatus() == null ? null : u.getCompany().getStatus().name());
        }
        return m;
    }
}
