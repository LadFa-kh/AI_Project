package com.example.backend.resume.entity;

import com.example.backend.skillTaxonomy.entity.SkillsTaxonomyEntity;
import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "resume_skills")
public class ResumeSkillEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "resume_id", nullable = false)
    private ResumeEntity resumeEntity;

    @Column(name = "skill_name")
    private String skillName;

    @Column(name = "skill_type")
    private String skillType; // HARD, SOFT

    @ManyToOne
    @JoinColumn(name = "matched_taxonomy_id")
    private SkillsTaxonomyEntity matchedTaxonomy; // nullable

    private Double confidence;
}
