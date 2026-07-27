package com.example.backend.company.entity;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "job_description")
public class JobDescriptionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "position_name")
    private String positionName;

    @Column(name = "required_skills")
    private String requiredSkills;

    @Column(name = "job_type")
    private String jobType;
}
