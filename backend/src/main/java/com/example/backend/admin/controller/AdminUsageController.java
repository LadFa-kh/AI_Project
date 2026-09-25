package com.example.backend.admin.controller;

import com.example.backend.handle.ApiResponse;
import com.example.backend.handle.PageResponse;
import com.example.backend.usage.UsageService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** B8: รายงานการใช้งาน — ค่าเริ่มต้นย้อนหลัง 30 วัน */
@RestController
@RequestMapping("/api/v1/admin/usage")
@RequiredArgsConstructor
public class AdminUsageController {

    private final UsageService usageService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Map<String, Object>>>> list(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(new ApiResponse<>(200, "OK", usageService.search(userId, action, from, to, page, size)));
    }

    /** Cost per action — ค่าเฉลี่ย token และค่าใช้จ่ายต่อครั้ง */
    @GetMapping("/cost")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cost(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(new ApiResponse<>(200, "OK", usageService.costReport(from, to)));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> summary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(new ApiResponse<>(200, "OK", usageService.summary(from, to)));
    }
}
