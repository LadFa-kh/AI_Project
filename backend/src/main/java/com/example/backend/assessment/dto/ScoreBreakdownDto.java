package com.example.backend.assessment.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * ที่มาของคะแนนแต่ละส่วน สำหรับให้หน้าเว็บแสดงว่าคะแนนที่ได้มาจากไหนบ้าง
 *
 * ตัวเลขทุกค่าในคลาสนี้คำนวณจากฝั่งเซิร์ฟเวอร์ทั้งหมด ไม่มีค่าใดมาจากปัญญาประดิษฐ์
 * ปัญญาประดิษฐ์รับตัวเลขชุดนี้ไปเรียบเรียงเป็นคำอธิบายภาษาไทยเท่านั้น จึงไม่มีทาง
 * ที่ตัวเลขบนหน้าจอกับคำอธิบายจะไม่ตรงกัน
 *
 * สูตรรวม: finalScore = resumeScore x resumeWeight + assessmentScore x assessmentWeight
 */
@Data
@Builder
public class ScoreBreakdownDto {

    // ---------- ส่วนที่ 1 คะแนนจากเรซูเม่ ----------

    /** จำนวนทักษะด้านเทคนิคที่สกัดได้จากเรซูเม่ (ตัวหารของ precision) */
    private int totalResumeSkills;

    /** จำนวนทักษะมาตรฐานของตำแหน่งงานนี้ที่ค้นเจอในฐานข้อมูล O*NET */
    private int totalStandardSkills;

    /** ทักษะในเรซูเม่ที่จับคู่กับทักษะมาตรฐานได้ */
    private List<String> matchedSkills;

    /** ทักษะในเรซูเม่ที่จับคู่ไม่ได้ — ยังนับเป็นตัวหาร จึงมีผลถ่วงคะแนนลง */
    private List<String> unmatchedSkills;

    /** (จำนวนที่จับคู่ได้ / totalResumeSkills) x 100 คะแนนก่อนคูณตัวถ่วง */
    private BigDecimal precisionScore;

    /** ตัวถ่วง: จับคู่ได้ 0 รายการ = 0.0, 1 รายการ = 0.3, 2 รายการ = 0.6, ตั้งแต่ 3 รายการ = 1.0 */
    private BigDecimal penaltyFactor;

    /** ผลลัพธ์ส่วนเรซูเม่ = precisionScore x penaltyFactor (ไม่เกิน 100) */
    private BigDecimal resumeScore;

    /** คำอธิบายว่าทำไมส่วนเรซูเม่ถึงได้คะแนนเท่านี้ */
    private String resumeScoreReason;

    // ---------- ส่วนที่ 2 คะแนนจากแบบประเมินตนเอง ----------

    /** จำนวนคำถามที่ผู้ใช้ตอบ */
    private int answeredQuestions;

    /** คะแนนสูงสุดต่อข้อ (ปัจจุบันคือ 4) */
    private int maxScorePerQuestion;

    /** ผลรวมคะแนนที่ผู้ใช้เลือกทุกข้อ */
    private int totalScoreObtained;

    /** คะแนนเต็มที่เป็นไปได้ = answeredQuestions x maxScorePerQuestion */
    private int maxPossibleScore;

    /** ผลลัพธ์ส่วนแบบประเมิน = (totalScoreObtained / maxPossibleScore) x 100 */
    private BigDecimal assessmentScore;

    // ---------- ส่วนที่ 3 การถ่วงน้ำหนักรวม ----------

    /** น้ำหนักของคะแนนเรซูเม่ในคะแนนรวม */
    private BigDecimal resumeWeight;

    /** น้ำหนักของคะแนนแบบประเมินในคะแนนรวม */
    private BigDecimal assessmentWeight;

    /** resumeScore x resumeWeight */
    private BigDecimal resumeContribution;

    /** assessmentScore x assessmentWeight */
    private BigDecimal assessmentContribution;

    /** ผลรวมสุดท้าย = resumeContribution + assessmentContribution */
    private BigDecimal finalScore;

    /** ชื่อตำแหน่งงานที่ใช้เป็นเกณฑ์เทียบ (ผู้ใช้กรอกเอง หรือปัญญาประดิษฐ์วิเคราะห์ให้) */
    private String roleUsedForMatching;

    /** true เมื่อผู้ใช้ไม่ได้กรอกตำแหน่งงาน แล้วระบบวิเคราะห์ให้จากทักษะในเรซูเม่ */
    private boolean roleInferredByAi;

    // ---------- B2: รายละเอียดการจับคู่ทักษะ (optional) ----------

    /** ทักษะแต่ละตัวจับคู่กับอะไร ด้วยวิธีไหน (WORD / SEMANTIC / NONE) */
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
    private List<com.example.backend.resume.service.SkillMatchDetail> matchDetails;

    /** SEMANTIC / WORD_ONLY / WORD_FALLBACK */
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
    private String matchMethod;
}
