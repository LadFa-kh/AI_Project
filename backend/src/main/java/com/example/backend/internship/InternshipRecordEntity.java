package com.example.backend.internship;

import com.example.backend.company.entity.CompanyEntity;
import com.example.backend.company.entity.JobDescriptionEntity;
import com.example.backend.user.entity.UserEntity;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** B6: ประวัติการฝึกงานของนักศึกษา (ผูกบริษัท และประกาศงานถ้ามี) */
@Data
@Entity
@Table(name = "internship_records", indexes = {
        @Index(name = "idx_intern_student", columnList = "student_id"),
        @Index(name = "idx_intern_company", columnList = "company_id"),
        @Index(name = "idx_intern_status", columnList = "status")
})
public class InternshipRecordEntity {

    public enum Status { APPLIED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED, REJECTED }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private UserEntity student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private CompanyEntity company;

    /** ชื่อบริษัทแบบพิมพ์เอง ใช้เมื่อบริษัทไม่มีในระบบ */
    @Column(name = "company_name_text")
    private String companyNameText;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id")
    private JobDescriptionEntity job;

    @Column(name = "position_name")
    private String positionName;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private Status status = Status.APPLIED;

    @Column(name = "supervisor_name")
    private String supervisorName;

    @Column(name = "supervisor_email")
    private String supervisorEmail;

    /** หมายเหตุจากนักศึกษา */
    @Column(name = "student_note", columnDefinition = "TEXT")
    private String studentNote;

    /** หมายเหตุ/ผลประเมินจากบริษัท */
    @Column(name = "company_note", columnDefinition = "TEXT")
    private String companyNote;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void onCreate() { createdAt = updatedAt = Instant.now(); if (status == null) status = Status.APPLIED; }

    @PreUpdate
    void onUpdate() { updatedAt = Instant.now(); }
}
