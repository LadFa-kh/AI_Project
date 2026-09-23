package com.example.backend.importer;

import com.example.backend.user.entity.UserEntity;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/** B7: ประวัติการนำเข้าไฟล์ (บันทึกทั้งรอบ dryRun และรอบจริง) */
@Data
@Entity
@Table(name = "import_logs", indexes = @Index(name = "idx_import_created", columnList = "created_at"))
public class ImportLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** COMPANY (เผื่ออนาคต JOB ฯลฯ) */
    @Column(name = "import_type", length = 30, nullable = false)
    private String importType;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "dry_run", nullable = false)
    private boolean dryRun;

    @Column(name = "total_rows")
    private int totalRows;

    private int created;
    private int updated;
    private int skipped;

    @Column(name = "error_count")
    private int errorCount;

    /** รายการ error แบบ JSON (สูงสุด 200 รายการ) */
    @Column(name = "errors_json", columnDefinition = "TEXT")
    private String errorsJson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "imported_by")
    private UserEntity importedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
