package com.example.backend.company.entity;

import com.example.backend.user.entity.UserEntity;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Entity
@Table(name = "job_description", indexes = {
        @Index(name = "idx_job_status", columnList = "status"),
        @Index(name = "idx_job_company", columnList = "company_id"),
        @Index(name = "idx_job_employer", columnList = "employer_id")
})
public class JobDescriptionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // เชื่อมกับ User สิทธิ์ EMPLOYER ที่เป็นคนลงประกาศ
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employer_id")
    private UserEntity employer;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "position_name")
    private String positionName;

    @Column(name = "required_skills")
    private String requiredSkills;

    @Column(name = "job_type")
    private String jobType;

    @Column(name = "job_description", columnDefinition = "TEXT")
    private String jobDescription;

    @Column(name = "duration")
    private String duration;

    @Column(name = "salary")
    private String salary;

    @Column(name = "contact_link", length = 500)
    private String contactLink;

    // ===== B4: บริษัทเจ้าของประกาศ (employer ด้านบน = posted_by คนที่กดลงประกาศ) =====
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private CompanyEntity company;

    // ===== B3: สถานะและช่วงเวลารับสมัคร (nullable เพื่อให้แถวเก่าไม่พัง, migration จะเติม OPEN) =====
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 10)
    private JobStatus status;

    @Column(name = "open_date")
    private LocalDate openDate;

    @Column(name = "close_date")
    private LocalDate closeDate;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void onCreate() { createdAt = updatedAt = Instant.now(); if (status == null) status = JobStatus.OPEN; }

    @PreUpdate
    void onUpdate() { updatedAt = Instant.now(); }
}
