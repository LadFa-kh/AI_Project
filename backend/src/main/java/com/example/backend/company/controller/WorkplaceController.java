package com.example.backend.company.controller;

import com.example.backend.company.dto.JobDescriptionResponseDto;
import com.example.backend.company.service.JobDescriptionService;
import com.example.backend.handle.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workplaces")
@RequiredArgsConstructor
public class WorkplaceController {

    private final JobDescriptionService jobDescriptionService;

    /**
     * B3: ค่าเริ่มต้นแสดงเฉพาะ OPEN (หน้าบ้านเดิมใช้ได้เหมือนเดิม)
     * ?status=ALL ใช้ได้เฉพาะ EMPLOYER/ADMIN
     * B10: ถ้าส่ง ?page= มา จะตอบแบบแบ่งหน้า {content,page,size,totalElements,totalPages}
     */
    @GetMapping
    public ResponseEntity<?> getAllWorkplaces(Authentication auth,
                                              @RequestParam(required = false) String status,
                                              @RequestParam(required = false) String q,
                                              @RequestParam(required = false) Integer page,
                                              @RequestParam(defaultValue = "20") int size) {
        boolean all = "ALL".equalsIgnoreCase(status) && isStaff(auth);
        if (page != null) {
            String st = all ? "ALL" : (isStaff(auth) && status != null ? status : "OPEN");
            PageResponse<JobDescriptionResponseDto> p = jobDescriptionService.searchJobs(st, q, page, size);
            return ResponseEntity.ok(p);
        }
        List<JobDescriptionResponseDto> list = jobDescriptionService.getAllJobDescriptions(all);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobDescriptionResponseDto> getWorkplaceById(Authentication auth, @PathVariable UUID id) {
        return ResponseEntity.ok(jobDescriptionService.getJobDescriptionById(id, isStaff(auth)));
    }

    static boolean isStaff(Authentication auth) {
        return auth != null && auth.isAuthenticated() && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_EMPLOYER") || a.getAuthority().equals("ROLE_ADMIN"));
    }
}
