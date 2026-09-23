package com.example.backend.importer;

import com.example.backend.handle.BusinessException;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * B7: อ่านไฟล์ตาราง CSV / XLSX เป็น List ของแถว (แถวแรก = หัวคอลัมน์)
 * เขียนเองโดยไม่พึ่ง library ภายนอก (Apache POI / OpenCSV) เพราะเพิ่ม dependency ใหม่ในโปรเจกต์นี้ไม่ได้
 *   - CSV: รองรับ "..." ครอบค่า, "" ภายในค่า, ขึ้นบรรทัดในค่า, BOM ของ Excel, ตัวคั่น , หรือ ;
 *   - XLSX: อ่านชีตแรก + sharedStrings (ข้อความ) + inlineStr + ตัวเลข ไม่รองรับสูตร (อ่านค่าที่คำนวณแล้วแทน)
 */
public final class TabularFileReader {

    private static final int MAX_ROWS = 5000;

    private TabularFileReader() {}

    public static List<List<String>> read(String filename, byte[] data) {
        String name = filename == null ? "" : filename.toLowerCase(Locale.ROOT);
        List<List<String>> rows;
        if (name.endsWith(".xlsx")) rows = readXlsx(data);
        else if (name.endsWith(".csv") || name.endsWith(".txt")) rows = readCsv(data);
        else throw BusinessException.badRequest("UNSUPPORTED_FILE", "รองรับเฉพาะไฟล์ .csv และ .xlsx");
        // ตัดแถวว่างท้ายไฟล์
        rows.removeIf(r -> r.stream().allMatch(c -> c == null || c.isBlank()));
        if (rows.size() > MAX_ROWS + 1) {
            throw BusinessException.badRequest("TOO_MANY_ROWS", "นำเข้าได้ไม่เกิน " + MAX_ROWS + " แถวต่อไฟล์");
        }
        return rows;
    }

    // ----------------------------- CSV -----------------------------

    static List<List<String>> readCsv(byte[] data) {
        String text = new String(data, StandardCharsets.UTF_8);
        if (text.startsWith("﻿")) text = text.substring(1);
        String firstLine = text.lines().findFirst().orElse("");
        char sep = count(firstLine, ';') > count(firstLine, ',') ? ';' : ',';

        List<List<String>> rows = new ArrayList<>();
        List<String> row = new ArrayList<>();
        StringBuilder cell = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (inQuotes) {
                if (c == '"') {
                    if (i + 1 < text.length() && text.charAt(i + 1) == '"') { cell.append('"'); i++; }
                    else inQuotes = false;
                } else cell.append(c);
            } else if (c == '"') {
                inQuotes = true;
            } else if (c == sep) {
                row.add(cell.toString().trim()); cell.setLength(0);
            } else if (c == '\n' || c == '\r') {
                if (c == '\r' && i + 1 < text.length() && text.charAt(i + 1) == '\n') i++;
                row.add(cell.toString().trim()); cell.setLength(0);
                rows.add(row); row = new ArrayList<>();
            } else cell.append(c);
        }
        if (cell.length() > 0 || !row.isEmpty()) { row.add(cell.toString().trim()); rows.add(row); }
        return rows;
    }

    private static int count(String s, char c) { return (int) s.chars().filter(x -> x == c).count(); }

    // ----------------------------- XLSX -----------------------------

    static List<List<String>> readXlsx(byte[] data) {
        try {
            Map<String, byte[]> parts = new HashMap<>();
            try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(data))) {
                ZipEntry e;
                while ((e = zip.getNextEntry()) != null) {
                    String n = e.getName();
                    if (n.equals("xl/sharedStrings.xml") || n.startsWith("xl/worksheets/sheet") || n.equals("xl/workbook.xml")) {
                        parts.put(n, readAll(zip));
                    }
                }
            }
            byte[] sheet = parts.get("xl/worksheets/sheet1.xml");
            if (sheet == null) {
                sheet = parts.entrySet().stream().filter(x -> x.getKey().startsWith("xl/worksheets/sheet"))
                        .sorted(Map.Entry.comparingByKey()).map(Map.Entry::getValue).findFirst()
                        .orElseThrow(() -> BusinessException.badRequest("INVALID_XLSX", "ไม่พบชีตในไฟล์ Excel"));
            }
            List<String> shared = new ArrayList<>();
            if (parts.containsKey("xl/sharedStrings.xml")) {
                NodeList sis = parse(parts.get("xl/sharedStrings.xml")).getElementsByTagName("si");
                for (int i = 0; i < sis.getLength(); i++) {
                    NodeList ts = ((Element) sis.item(i)).getElementsByTagName("t");
                    StringBuilder sb = new StringBuilder();
                    for (int j = 0; j < ts.getLength(); j++) sb.append(ts.item(j).getTextContent());
                    shared.add(sb.toString());
                }
            }
            List<List<String>> rows = new ArrayList<>();
            NodeList rowNodes = parse(sheet).getElementsByTagName("row");
            for (int i = 0; i < rowNodes.getLength(); i++) {
                Element rowEl = (Element) rowNodes.item(i);
                int rowNum = parseIntOr(rowEl.getAttribute("r"), rows.size() + 1);
                while (rows.size() < rowNum - 1) rows.add(new ArrayList<>()); // แถวว่างที่ถูกข้าม
                List<String> row = new ArrayList<>();
                NodeList cells = rowEl.getElementsByTagName("c");
                for (int j = 0; j < cells.getLength(); j++) {
                    Element c = (Element) cells.item(j);
                    int col = colIndex(c.getAttribute("r"), row.size());
                    while (row.size() < col) row.add("");
                    row.add(cellValue(c, shared).trim());
                }
                rows.add(row);
            }
            return rows;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw BusinessException.badRequest("INVALID_XLSX", "อ่านไฟล์ Excel ไม่ได้: " + e.getMessage());
        }
    }

    private static String cellValue(Element c, List<String> shared) {
        String t = c.getAttribute("t");
        if ("inlineStr".equals(t)) {
            NodeList ts = c.getElementsByTagName("t");
            return ts.getLength() > 0 ? ts.item(0).getTextContent() : "";
        }
        NodeList vs = c.getElementsByTagName("v");
        if (vs.getLength() == 0) return "";
        String v = vs.item(0).getTextContent();
        if ("s".equals(t)) {
            int idx = parseIntOr(v, -1);
            return idx >= 0 && idx < shared.size() ? shared.get(idx) : "";
        }
        // ตัวเลขเช่นเลขผู้เสียภาษี 13 หลัก Excel เก็บเป็น 1.23456789E12 → แปลงกลับเป็นจำนวนเต็ม
        if (v.matches("-?\\d+(\\.\\d+)?[eE][+-]?\\d+")) {
            try { return new java.math.BigDecimal(v).toPlainString(); } catch (Exception ignored) { }
        }
        if (v.endsWith(".0")) return v.substring(0, v.length() - 2);
        return v;
    }

    private static int colIndex(String ref, int fallback) {
        if (ref == null || ref.isEmpty()) return fallback;
        int col = 0, i = 0;
        while (i < ref.length() && Character.isLetter(ref.charAt(i))) {
            col = col * 26 + (Character.toUpperCase(ref.charAt(i)) - 'A' + 1);
            i++;
        }
        return col == 0 ? fallback : col - 1;
    }

    private static int parseIntOr(String s, int d) {
        try { return Integer.parseInt(s.replaceAll("[^0-9]", "")); } catch (Exception e) { return d; }
    }

    private static Document parse(byte[] xml) throws Exception {
        DocumentBuilderFactory f = DocumentBuilderFactory.newInstance();
        // กัน XXE
        f.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        f.setExpandEntityReferences(false);
        f.setNamespaceAware(false);
        return f.newDocumentBuilder().parse(new ByteArrayInputStream(xml));
    }

    private static byte[] readAll(InputStream in) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        long total = 0;
        while ((n = in.read(buf)) > 0) {
            total += n;
            if (total > 50L * 1024 * 1024) throw BusinessException.badRequest("FILE_TOO_LARGE", "ไฟล์ Excel ใหญ่เกินไป");
            out.write(buf, 0, n);
        }
        return out.toByteArray();
    }
}
