package com.example.backend.importer;

import com.example.backend.company.entity.CompanyEntity;
import com.example.backend.company.repository.CompanyRepository;
import com.example.backend.handle.BusinessException;
import com.example.backend.user.entity.UserEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * B7: นำเข้าบริษัทจาก CSV/XLSX
 *   - upsert: หาด้วย tax_id ก่อน ไม่มีเลขภาษีค่อยหาด้วย name_th (ไม่สนตัวพิมพ์)
 *     เจอ = อัปเดตเฉพาะช่องที่มีค่า / ไม่เจอ = สร้างใหม่ สถานะ ACTIVE
 *   - dryRun=true: ตรวจทุกแถวแล้วรายงานว่าจะสร้าง/อัปเดตกี่รายการ แต่ไม่บันทึกบริษัทลงฐานข้อมูล
 *   - แถวที่ผิดถูกข้าม ไม่ทำให้ทั้งไฟล์ล้ม และรายงานเลขแถวตามไฟล์ (แถวหัว = 1)
 */
@Service
@RequiredArgsConstructor
public class CompanyImportService {

    private final CompanyRepository companyRepository;
    private final ImportLogRepository logRepository;
    private final ObjectMapper objectMapper;

    public record RowError(int row, String field, String message) {}

    public record ImportResult(UUID logId, boolean dryRun, int totalRows, int created, int updated, int skipped,
                               List<RowError> errors) {}

    @Transactional
    public ImportResult importFile(String filename, byte[] data, boolean dryRun, UserEntity admin) {
        List<List<String>> rows = TabularFileReader.read(filename, data);
        if (rows.isEmpty()) throw BusinessException.badRequest("EMPTY_FILE", "ไฟล์ว่าง");

        List<ImportColumn> cols = ImporterConfig.COMPANY;
        List<String> header = rows.get(0);
        Map<String, Integer> idx = new HashMap<>();
        for (ImportColumn c : cols) {
            for (int i = 0; i < header.size(); i++) {
                if (c.matches(header.get(i))) { idx.put(c.field(), i); break; }
            }
        }
        List<String> missing = cols.stream().filter(c -> c.required() && !idx.containsKey(c.field())).map(ImportColumn::header).toList();
        if (!missing.isEmpty()) {
            throw BusinessException.badRequest("MISSING_COLUMNS", "ไม่พบคอลัมน์ที่จำเป็น: " + String.join(", ", missing)
                    + " (ดาวน์โหลด template ได้ที่ /api/v1/admin/companies/import/template)");
        }

        int created = 0, updated = 0, skipped = 0;
        List<RowError> errors = new ArrayList<>();
        Set<String> seenKeys = new HashSet<>();

        for (int r = 1; r < rows.size(); r++) {
            int rowNo = r + 1;
            List<String> row = rows.get(r);
            Map<String, String> v = new HashMap<>();
            for (ImportColumn c : cols) {
                Integer i = idx.get(c.field());
                String val = i == null || i >= row.size() ? "" : row.get(i).trim();
                v.put(c.field(), val);
            }

            List<RowError> rowErrs = validate(rowNo, v, cols);
            String key = !v.get("taxId").isEmpty() ? "tax:" + v.get("taxId") : "name:" + v.get("nameTh").toLowerCase();
            if (rowErrs.isEmpty() && !seenKeys.add(key)) {
                rowErrs.add(new RowError(rowNo, "", "ซ้ำกับแถวก่อนหน้าในไฟล์เดียวกัน"));
            }
            if (!rowErrs.isEmpty()) { errors.addAll(rowErrs); skipped++; continue; }

            Optional<CompanyEntity> existing = v.get("taxId").isEmpty()
                    ? companyRepository.findFirstByNameThIgnoreCase(v.get("nameTh"))
                    : companyRepository.findByTaxId(v.get("taxId"))
                        .or(() -> companyRepository.findFirstByNameThIgnoreCase(v.get("nameTh"))
                                .filter(c -> c.getTaxId() == null));
            boolean isNew = existing.isEmpty();
            if (!dryRun) {
                // dryRun: ไม่แตะ entity เลย (กันไม่ให้ถูก flush ลงฐานข้อมูลภายหลังโดยไม่ตั้งใจ)
                CompanyEntity c = existing.orElseGet(() -> {
                    CompanyEntity n = new CompanyEntity();
                    n.setStatus(CompanyEntity.Status.ACTIVE);
                    return n;
                });
                apply(c, v);
                companyRepository.save(c);
            }
            if (isNew) created++; else updated++;
        }

        return new ImportResult(null, dryRun, rows.size() - 1, created, updated, skipped, errors);
    }

    @Transactional
    public UUID saveLog(String filename, ImportResult r, UserEntity admin) {
        ImportLogEntity l = new ImportLogEntity();
        l.setImportType("COMPANY");
        l.setFileName(filename);
        l.setDryRun(r.dryRun());
        l.setTotalRows(r.totalRows());
        l.setCreated(r.created());
        l.setUpdated(r.updated());
        l.setSkipped(r.skipped());
        l.setErrorCount(r.errors().size());
        try {
            l.setErrorsJson(objectMapper.writeValueAsString(r.errors().stream().limit(200).toList()));
        } catch (Exception e) {
            l.setErrorsJson("[]");
        }
        l.setImportedBy(admin);
        l.setCreatedAt(Instant.now());
        return logRepository.save(l).getId();
    }

    private List<RowError> validate(int rowNo, Map<String, String> v, List<ImportColumn> cols) {
        List<RowError> errs = new ArrayList<>();
        for (ImportColumn c : cols) {
            String val = v.get(c.field());
            if (c.required() && val.isEmpty()) errs.add(new RowError(rowNo, c.header(), "ต้องมีค่า"));
            if (c.maxLength() > 0 && val.length() > c.maxLength())
                errs.add(new RowError(rowNo, c.header(), "ยาวเกิน " + c.maxLength() + " ตัวอักษร"));
        }
        String tax = v.get("taxId");
        if (!tax.isEmpty() && !tax.matches("\\d{10,13}")) {
            errs.add(new RowError(rowNo, "tax_id", "ต้องเป็นตัวเลข 10–13 หลัก"));
        }
        String email = v.get("email");
        if (!email.isEmpty() && !email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            errs.add(new RowError(rowNo, "email", "รูปแบบอีเมลไม่ถูกต้อง"));
        }
        String web = v.get("website");
        if (!web.isEmpty() && !web.matches("(?i)^https?://.+")) {
            errs.add(new RowError(rowNo, "website", "ต้องขึ้นต้นด้วย http:// หรือ https://"));
        }
        return errs;
    }

    private void apply(CompanyEntity c, Map<String, String> v) {
        c.setNameTh(v.get("nameTh"));
        setIf(v.get("nameEn"), c::setNameEn);
        setIf(v.get("taxId"), c::setTaxId);
        setIf(v.get("industry"), c::setIndustry);
        setIf(v.get("description"), c::setDescription);
        setIf(v.get("website"), c::setWebsite);
        setIf(v.get("email"), c::setEmail);
        setIf(v.get("phone"), c::setPhone);
        setIf(v.get("address"), c::setAddress);
        setIf(v.get("province"), c::setProvince);
        setIf(v.get("logoUrl"), c::setLogoUrl);
    }

    private static void setIf(String val, java.util.function.Consumer<String> setter) {
        if (val != null && !val.isEmpty()) setter.accept(val);
    }
}
