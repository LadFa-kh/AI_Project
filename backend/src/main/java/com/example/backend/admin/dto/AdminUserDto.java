package com.example.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminUserDto {
    private UUID id;
    private String email;
    private String fullName;
    private String telephone;
    private String role;
    private Instant createdAt;
    private long resumeCount;   // จำนวนเรซูเม่ที่ user คนนี้อัปโหลด
    // ไม่มี passwordHash เด็ดขาด
}