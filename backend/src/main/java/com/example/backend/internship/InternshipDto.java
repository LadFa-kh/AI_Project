package com.example.backend.internship;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** ใช้ทั้งรับและส่ง — ฟิลด์ id/เวลา/ข้อมูลนักศึกษา ถูกเมินตอนรับ */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class InternshipDto {
    private UUID id;
    private UUID studentId;
    private String studentName;
    private String studentEmail;
    private UUID companyId;
    private String companyName;
    private UUID jobId;
    private String positionName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private String supervisorName;
    private String supervisorEmail;
    private String studentNote;
    private String companyNote;
    private Instant createdAt;
    private Instant updatedAt;
}
