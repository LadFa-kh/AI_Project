package com.example.backend.importer;

import java.util.List;

/**
 * B7: ชุดคอลัมน์ของตัวนำเข้าแต่ละประเภท — อยากนำเข้าข้อมูลชนิดใหม่ (เช่น ประกาศงาน)
 * ก็เพิ่ม config ใหม่ + เขียนตัว upsert อีกตัว ส่วนอ่านไฟล์ / ตรวจคอลัมน์ / dryRun / log ใช้ร่วมกัน
 */
public final class ImporterConfig {

    private ImporterConfig() {}

    public static final List<ImportColumn> COMPANY = List.of(
            new ImportColumn("nameTh", "name_th", List.of("ชื่อบริษัท", "ชื่อบริษัท(ไทย)", "ชื่อไทย", "company_name", "companyname"), true, 255, "บริษัท ตัวอย่าง จำกัด"),
            new ImportColumn("nameEn", "name_en", List.of("ชื่ออังกฤษ", "ชื่อบริษัท(อังกฤษ)", "english_name"), false, 255, "Example Co., Ltd."),
            new ImportColumn("taxId", "tax_id", List.of("เลขประจำตัวผู้เสียภาษี", "เลขผู้เสียภาษี", "taxid", "tax"), false, 20, "0105555012345"),
            new ImportColumn("industry", "industry", List.of("อุตสาหกรรม", "ประเภทธุรกิจ"), false, 255, "Software"),
            new ImportColumn("description", "description", List.of("รายละเอียด", "คำอธิบาย"), false, 0, "พัฒนาซอฟต์แวร์องค์กร"),
            new ImportColumn("website", "website", List.of("เว็บไซต์", "url"), false, 500, "https://example.co.th"),
            new ImportColumn("email", "email", List.of("อีเมล"), false, 255, "hr@example.co.th"),
            new ImportColumn("phone", "phone", List.of("โทรศัพท์", "เบอร์โทร", "telephone"), false, 255, "02-123-4567"),
            new ImportColumn("address", "address", List.of("ที่อยู่"), false, 0, "123 ถ.มิตรภาพ"),
            new ImportColumn("province", "province", List.of("จังหวัด"), false, 255, "ขอนแก่น"),
            new ImportColumn("logoUrl", "logo_url", List.of("โลโก้", "logo"), false, 500, "")
    );

    /** template CSV (มี BOM เพื่อให้ Excel เปิดภาษาไทยไม่เพี้ยน) */
    public static String templateCsv(List<ImportColumn> cols) {
        StringBuilder sb = new StringBuilder("﻿");
        sb.append(String.join(",", cols.stream().map(ImportColumn::header).toList())).append("\r\n");
        sb.append(String.join(",", cols.stream().map(c -> quote(c.example())).toList())).append("\r\n");
        return sb.toString();
    }

    private static String quote(String s) {
        if (s == null) return "";
        return s.contains(",") || s.contains("\"") ? "\"" + s.replace("\"", "\"\"") + "\"" : s;
    }
}
