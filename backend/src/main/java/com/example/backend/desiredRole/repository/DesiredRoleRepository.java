package com.example.backend.desiredRole.repository;

import com.example.backend.desiredRole.entity.DesiredRoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DesiredRoleRepository extends JpaRepository<DesiredRoleEntity, UUID> {
    Optional<DesiredRoleEntity> findByUser_Id(UUID userId);
}
