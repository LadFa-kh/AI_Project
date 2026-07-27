package com.example.backend.company.repository;

import com.example.backend.company.entity.JobDescriptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface JobDescriptionRepository extends JpaRepository<JobDescriptionEntity, UUID> {

}
