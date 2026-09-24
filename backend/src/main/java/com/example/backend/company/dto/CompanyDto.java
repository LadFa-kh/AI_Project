package com.example.backend.company.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/** ใช้ทั้งเป็น response และ request (PUT /companies/me, admin) — ฟิลด์ id/status/เวลา ถูกเมินตอนรับเข้า */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CompanyDto {
    private UUID id;
    private String nameTh;
    private String nameEn;
    private String taxId;
    private String industry;
    private String description;
    private String logoUrl;
    private String website;
    private String email;
    private String phone;
    private String address;
    private String province;
    private String status;
    private String rejectReason;
    private Long jobCount;
    private Instant createdAt;
    private Instant updatedAt;
}
