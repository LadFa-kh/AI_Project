package com.example.backend.company.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class JobStatusUpdateDto {
    private String status;      // DRAFT | OPEN | CLOSED
    private LocalDate openDate;  // ไม่บังคับ
    private LocalDate closeDate; // ไม่บังคับ
}
