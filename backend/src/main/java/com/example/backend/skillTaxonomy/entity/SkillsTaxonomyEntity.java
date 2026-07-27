package com.example.backend.skillTaxonomy.entity;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "skills_taxonomy")
public class SkillsTaxonomyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private  String code;
    private  String name;

    private String type;

    private String source;

}
