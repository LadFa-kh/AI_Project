package com.example.backend.user.consent;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UserConsentRepository extends JpaRepository<UserConsentEntity, UUID> {
    List<UserConsentEntity> findByUser_IdOrderByAcceptedAtDesc(UUID userId);
    boolean existsByUser_IdAndPolicyTypeAndPolicyVersionAndWithdrawnAtIsNull(UUID userId, String type, String version);
    void deleteByUser_Id(UUID userId);
}
