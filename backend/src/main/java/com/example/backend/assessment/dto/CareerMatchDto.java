package com.example.backend.assessment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** B1: อาชีพที่เหมาะ 1 รายการ — percent ของทุกรายการรวมกันได้ 100 พอดี */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CareerMatchDto {
    private String roleName;
    /** ชื่อสายงานภาษาไทย (optional — ไม่มีค่า = ไม่อยู่ใน JSON) */
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
    private String roleNameTh;
    private int percent;
    private List<String> matchedSkills;
    private List<String> missingSkills;
}
