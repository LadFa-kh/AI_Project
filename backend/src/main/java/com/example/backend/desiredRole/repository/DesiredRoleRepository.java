package com.example.backend.desiredRole.repository;

import com.example.backend.desiredRole.entity.DesiredRoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DesiredRoleRepository extends JpaRepository<DesiredRoleEntity, UUID> {
    Optional<DesiredRoleEntity> findByUserId(UUID userId);
}
