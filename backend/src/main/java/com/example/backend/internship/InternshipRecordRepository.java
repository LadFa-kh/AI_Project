package com.example.backend.internship;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface InternshipRecordRepository extends JpaRepository<InternshipRecordEntity, UUID> {
    List<InternshipRecordEntity> findByStudent_IdOrderByCreatedAtDesc(UUID studentId);
    List<InternshipRecordEntity> findByCompany_IdOrderByCreatedAtDesc(UUID companyId);
    void deleteByStudent_Id(UUID studentId);

    @Query("select r from InternshipRecordEntity r where (:status is null or r.status = :status) " +
           "and (:companyId is null or r.company.id = :companyId)")
    Page<InternshipRecordEntity> search(@Param("status") InternshipRecordEntity.Status status,
                                        @Param("companyId") UUID companyId, Pageable pageable);
}
