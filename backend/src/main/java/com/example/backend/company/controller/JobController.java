package com.example.backend.company.controller;

import com.example.backend.company.dto.JobDescriptionResponseDto;
import com.example.backend.company.dto.JobPostRequestDto;
import com.example.backend.company.service.JobDescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobDescriptionService jobDescriptionService;

    @PostMapping
    public ResponseEntity<JobDescriptionResponseDto> postJob(@RequestBody JobPostRequestDto request) {
        return ResponseEntity.ok(jobDescriptionService.createJobDescription(request));
    }

    // หมายเหตุ: เคยมี GET /jobs/{id} อยู่ตรงนี้ ถอดออกแล้วเพราะซ้ำซ้อน
    // WorkplaceController มี GET /workplaces/{id} ที่เรียก
    // jobDescriptionService.getJobDescriptionById ตัวเดียวกันอยู่ก่อนแล้ว
    // และหน้าบ้านใช้เส้นทางนั้น การมีสองเส้นทางที่ทำงานเหมือนกันเป๊ะทำให้
    // คนอ่านโค้ดสับสนว่าควรใช้อันไหน และเวลาแก้ต้องแก้สองที่
}