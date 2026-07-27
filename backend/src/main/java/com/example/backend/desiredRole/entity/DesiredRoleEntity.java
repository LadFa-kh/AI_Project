package com.example.backend.desiredRole.entity;

import com.example.backend.skillTaxonomy.entity.SkillsTaxonomyEntity;
import com.example.backend.user.entity.UserEntity;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "desired_roles")
public class DesiredRoleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity userEntity;

    @Column(name = "role_name")
    private String roleName;

    @ManyToOne
    @JoinColumn(name = "taxonomy_id")
    private SkillsTaxonomyEntity taxonomy;

    @Column(name = "created_at")
    private Instant createdAt;
}
