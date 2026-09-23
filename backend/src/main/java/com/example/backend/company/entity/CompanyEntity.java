package com.example.backend.company.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/** B4: ข้อมูลบริษัท แยกออกจากประกาศงาน (1 บริษัท : หลายประกาศ : หลายผู้ใช้) */
@Data
@Entity
@Table(name = "companies", indexes = {
        @Index(name = "idx_companies_name_th", columnList = "name_th"),
        @Index(name = "idx_companies_status", columnList = "status")
})
public class CompanyEntity {

    public enum Status { PENDING, ACTIVE, SUSPENDED, REJECTED }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "name_th", nullable = false)
    private String nameTh;

    @Column(name = "name_en")
    private String nameEn;

    @Column(name = "tax_id", unique = true, length = 20)
    private String taxId;

    private String industry;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(length = 500)
    private String website;

    private String email;
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String address;

    private String province;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Status status = Status.ACTIVE;

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void onCreate() { createdAt = updatedAt = Instant.now(); if (status == null) status = Status.ACTIVE; }

    @PreUpdate
    void onUpdate() { updatedAt = Instant.now(); }
}
