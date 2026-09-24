package com.example.backend.company.repository;

import com.example.backend.company.entity.CompanyEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface CompanyRepository extends JpaRepository<CompanyEntity, UUID> {
    Optional<CompanyEntity> findByTaxId(String taxId);
    Optional<CompanyEntity> findFirstByNameThIgnoreCase(String nameTh);
    Page<CompanyEntity> findByStatus(CompanyEntity.Status status, Pageable pageable);

    @Query("select c from CompanyEntity c where (:status is null or c.status = :status) and " +
           "(:q is null or lower(c.nameTh) like lower(concat('%', cast(:q as string), '%')) " +
           " or lower(c.nameEn) like lower(concat('%', cast(:q as string), '%')))")
    Page<CompanyEntity> search(@Param("status") CompanyEntity.Status status, @Param("q") String q, Pageable pageable);
}
