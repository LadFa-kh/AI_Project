package com.example.backend.company.repository;

import com.example.backend.company.entity.JobDescriptionEntity;
import com.example.backend.company.entity.JobStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JobDescriptionRepository extends JpaRepository<JobDescriptionEntity, UUID> {

    /**
     * ดึงเฉพาะประกาศงานของผู้ประกาศรายนั้น ใช้ในหน้าจัดการประกาศของ EMPLOYER
     * ซึ่งต้องไม่เห็นประกาศของบริษัทอื่น
     */
    List<JobDescriptionEntity> findByEmployer_Id(UUID employerId);

    // ===== B3/B4 =====
    List<JobDescriptionEntity> findByStatus(JobStatus status);
    List<JobDescriptionEntity> findByStatusNot(JobStatus status);
    List<JobDescriptionEntity> findByCompany_Id(UUID companyId);
    List<JobDescriptionEntity> findByCompany_IdAndStatus(UUID companyId, JobStatus status);
    long countByCompany_Id(UUID companyId);
    List<JobDescriptionEntity> findByStatusAndCloseDateBefore(JobStatus status, LocalDate date);
    List<JobDescriptionEntity> findByStatusAndOpenDateLessThanEqual(JobStatus status, LocalDate date);
    List<JobDescriptionEntity> findByStatusIsNull();
    List<JobDescriptionEntity> findByCompanyIsNull();

    // B10: ค้นหาแบบแบ่งหน้า (status = null คือทุกสถานะ)
    @Query("select j from JobDescriptionEntity j where (:status is null or j.status = :status) and " +
           "(:q is null or lower(j.positionName) like lower(concat('%', cast(:q as string), '%')) " +
           " or lower(j.companyName) like lower(concat('%', cast(:q as string), '%')))")
    Page<JobDescriptionEntity> search(@Param("status") JobStatus status, @Param("q") String q, Pageable pageable);
}
