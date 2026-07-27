package com.example.backend.company.repository;

import com.example.backend.company.entity.JobDescriptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface JobDescriptionRepository extends JpaRepository<JobDescriptionEntity, UUID> {

}
