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
    private int percent;
    private List<String> matchedSkills;
    private List<String> missingSkills;
}
