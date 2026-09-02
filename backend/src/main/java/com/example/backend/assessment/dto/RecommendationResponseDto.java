package com.example.backend.assessment.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponseDto {
    private List<String> missing_skills;
    private String recommendation_summary;
    private List<String> recommendation_items;

    /**
     * คำอธิบายที่มาของคะแนนเป็นภาษาไทย เขียนโดยปัญญาประดิษฐ์จากตัวเลขที่ฝั่งเซิร์ฟเวอร์
     * คำนวณเสร็จแล้วและส่งไปให้ ไม่ใช่ตัวเลขที่ปัญญาประดิษฐ์คิดขึ้นเอง
     */
    private String score_explanation;
}