package com.example.backend.resume.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** B2: ที่มาของการจับคู่ทักษะ 1 รายการ — ใช้แสดงใน scoreBreakdown.matchDetails */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SkillMatchDetail {
    /** ทักษะจากเรซูเม่ */
    private String resumeSkill;
    /** ทักษะมาตรฐานที่จับคู่ได้ (null = ไม่ตรงกับอะไรเลย) */
    private String standardSkill;
    /** WORD = ตรงกันด้วยคำ, SEMANTIC = LLM ตัดสินว่าความหมายตรงกัน, NONE = ไม่ตรง */
    private String method;
    /** ความมั่นใจ 0–1 (WORD = 1.0) */
    private Double confidence;
}
