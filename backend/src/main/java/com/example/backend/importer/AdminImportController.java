package com.example.backend.importer;

import com.example.backend.config.CurrentUserProvider;
import com.example.backend.handle.ApiResponse;
import com.example.backend.handle.BusinessException;
import com.example.backend.handle.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * B7 endpoints (ADMIN)
 *   GET  /api/v1/admin/companies/import/template      ดาวน์โหลด template CSV
 *   POST /api/v1/admin/companies/import?dryRun=true   อัปโหลด CSV/XLSX (form-data: file) — ค่าเริ่มต้น dryRun=true
 *   GET  /api/v1/admin/imports?page=&size=            ประวัติการนำเข้า
 */
@RestController
@RequiredArgsConstructor
public class AdminImportController {

    private static final long MAX_BYTES = 5L * 1024 * 1024;

    private final CompanyImportService importService;
    private final ImportLogRepository logRepository;
    private final CurrentUserProvider currentUser;

    @GetMapping("/api/v1/admin/companies/import/template")
    public ResponseEntity<byte[]> template() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"company_import_template.csv\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(ImporterConfig.templateCsv(ImporterConfig.COMPANY).getBytes(StandardCharsets.UTF_8));
    }

    @PostMapping(value = "/api/v1/admin/companies/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<CompanyImportService.ImportResult>> importCompanies(
            Authentication auth,
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "true") boolean dryRun) throws Exception {
        if (file.isEmpty()) throw BusinessException.badRequest("EMPTY_FILE", "กรุณาแนบไฟล์");
        if (file.getSize() > MAX_BYTES) throw BusinessException.badRequest("FILE_TOO_LARGE", "ไฟล์ต้องไม่เกิน 5 MB");
        var admin = currentUser.getCurrentUser(auth);
        var result = importService.importFile(file.getOriginalFilename(), file.getBytes(), dryRun, admin);
        var logId = importService.saveLog(file.getOriginalFilename(), result, admin);
        var withLog = new CompanyImportService.ImportResult(logId, result.dryRun(), result.totalRows(), result.created(),
                result.updated(), result.skipped(), result.errors());
        String msg = dryRun
                ? "ตรวจไฟล์เสร็จ (ยังไม่บันทึก) — ถ้าผลถูกต้องให้ส่งซ้ำด้วย dryRun=false"
                : "นำเข้าเสร็จ";
        return ResponseEntity.ok(new ApiResponse<>(200, msg, withLog));
    }

    @GetMapping("/api/v1/admin/imports")
    public ResponseEntity<ApiResponse<PageResponse<Map<String, Object>>>> logs(
            @RequestParam(defaultValue = "COMPANY") String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var p = logRepository.findByImportTypeOrderByCreatedAtDesc(type.toUpperCase(),
                PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100))));
        return ResponseEntity.ok(new ApiResponse<>(200, "OK", PageResponse.of(p.map(l -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", l.getId());
            m.put("type", l.getImportType());
            m.put("fileName", l.getFileName());
            m.put("dryRun", l.isDryRun());
            m.put("totalRows", l.getTotalRows());
            m.put("created", l.getCreated());
            m.put("updated", l.getUpdated());
            m.put("skipped", l.getSkipped());
            m.put("errorCount", l.getErrorCount());
            m.put("errorsJson", l.getErrorsJson());
            m.put("importedBy", l.getImportedBy() == null ? null : l.getImportedBy().getEmail());
            m.put("createdAt", l.getCreatedAt());
            return m;
        }))));
    }
}
