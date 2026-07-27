package com.example.backend.skillTaxonomy.repository;

import com.example.backend.skillTaxonomy.entity.SkillsTaxonomyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SkillsTaxonomyRepository extends JpaRepository<SkillsTaxonomyEntity, UUID> {
    Optional<SkillsTaxonomyEntity> findByCode(String code);
}
