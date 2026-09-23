package com.example.backend.importer;

import java.util.List;

/**
 * B7: นิยามคอลัมน์ 1 ช่องของตัวนำเข้า (generic importer config)
 * @param field    ชื่อฟิลด์ปลายทาง
 * @param header   หัวคอลัมน์หลักที่ใช้ในไฟล์ template
 * @param aliases  ชื่อหัวคอลัมน์อื่นที่ยอมรับ (ไทย/อังกฤษ/ตัวพิมพ์ต่างกัน)
 * @param required ต้องมีค่าไหม
 * @param maxLength ความยาวสูงสุด (0 = ไม่จำกัด)
 * @param example  ตัวอย่างค่าใน template
 */
public record ImportColumn(String field, String header, List<String> aliases, boolean required, int maxLength, String example) {

    public boolean matches(String h) {
        String n = norm(h);
        if (norm(header).equals(n) || norm(field).equals(n)) return true;
        return aliases.stream().anyMatch(a -> norm(a).equals(n));
    }

    static String norm(String s) {
        return s == null ? "" : s.trim().toLowerCase().replaceAll("[\\s_\\-*]", "");
    }
}
