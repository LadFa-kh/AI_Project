package com.example.backend.company.controller;

import com.example.backend.company.dto.JobDescriptionResponseDto;
import com.example.backend.company.dto.JobPostRequestDto;
import com.example.backend.company.service.JobDescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobDescriptionService jobDescriptionService;

    @PostMapping
    public ResponseEntity<JobDescriptionResponseDto> postJob(@RequestBody JobPostRequestDto request) {
        return ResponseEntity.ok(jobDescriptionService.createJobDescription(request));
    }

    /**
     * ดึงรายละเอียดของตำแหน่งงานทีละรายการ
     *
     * เดิมไม่มี endpoint นี้ หน้ารายละเอียดฝึกงานจึงต้องไปหยิบข้อมูลจากรายการที่
     * โหลดไว้ก่อนหน้า (sessionStorage) ซึ่งมีแค่ชื่อบริษัท ตำแหน่ง ประเภทงาน และ
     * ทักษะ ทำให้ฟิลด์ที่ผู้ประกาศกรอกไว้จริง — คำอธิบายงาน ระยะเวลา ค่าตอบแทน
     * ลิงก์สมัคร — ไม่เคยถูกส่งมาถึงหน้าเว็บเลย ทั้งที่บันทึกอยู่ในฐานข้อมูล
     * ครบถ้วน (ดู JobDescriptionEntity)
     *
     * JobDescriptionResponseDto มีครบทุกฟิลด์อยู่แล้ว และ service ก็มีเมธอด
     * getJobDescriptionById อยู่แล้วเช่นกัน ตรงนี้จึงเป็นแค่การเปิดทางให้เรียกใช้
     *
     * ไม่ได้ใส่ไว้ใน permitAll ของ SecurityConfig จึงต้องล็อกอินก่อน ซึ่งตรงกับ
     * หน้าอื่นในกลุ่มจับคู่ฝึกงานที่ถูก RouteGuard ครอบไว้อยู่แล้ว
     */
    @GetMapping("/{id}")
    public ResponseEntity<JobDescriptionResponseDto> getJob(@PathVariable UUID id) {
        return ResponseEntity.ok(jobDescriptionService.getJobDescriptionById(id));
    }
}