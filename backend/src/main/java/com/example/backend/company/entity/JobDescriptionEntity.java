package com.example.backend.company.entity;

import com.example.backend.user.entity.UserEntity;
import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Data
@Entity
@Table(name = "job_description")
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
}
