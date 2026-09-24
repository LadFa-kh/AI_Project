package com.example.backend.resume.service;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * ผลการจับคู่ทักษะระหว่างเรซูเม่กับทักษะมาตรฐาน O*NET พร้อมที่มาของคะแนนทุกขั้น
 *
 * เดิม calculateOnetSkillMatchScore คืนมาเป็นตัวเลขเดียว ทำให้ไม่มีใครตอบได้ว่า
 * คะแนนนั้นมาจากไหน ต้องไปไล่โค้ดเอาเอง คลาสนี้เก็บค่ากลางทุกตัวที่ใช้ระหว่างทาง
 * เพื่อให้ทั้งหน้าเว็บและคำอธิบายจากปัญญาประดิษฐ์อ้างอิงตัวเลขชุดเดียวกันได้
 *
 * ทุกค่าในคลาสนี้คำนวณจากฝั่งเซิร์ฟเวอร์ทั้งหมด ไม่มีค่าใดมาจากปัญญาประดิษฐ์
 * ปัญญาประดิษฐ์มีหน้าที่เพียงเรียบเรียงตัวเลขเหล่านี้เป็นภาษาที่ผู้ใช้อ่านเข้าใจ
 */
@Data
@Builder
public class SkillMatchResult {

    /** คะแนนเรซูเม่สุดท้าย = precisionScore x penaltyFactor (ไม่เกิน 100) */
    private BigDecimal resumeScore;

    /** ทักษะในเรซูเม่ที่จับคู่กับทักษะมาตรฐานได้ */
    private List<String> matchedSkills;

    /** ทักษะในเรซูเม่ที่จับคู่กับทักษะมาตรฐานไม่ได้ — เป็นตัวที่ถ่วงคะแนนลง */
    private List<String> unmatchedSkills;

    /** จำนวนทักษะทั้งหมดที่สกัดได้จากเรซูเม่ (ตัวหารของ precisionScore) */
    private int totalResumeSkills;

    /** จำนวนทักษะมาตรฐานที่ค้นเจอจากชื่อตำแหน่งงาน ถ้าเป็น 0 คะแนนจะเป็น 0 เสมอ */
    private int totalStandardSkills;

    /** (matchedSkills / totalResumeSkills) x 100 — คะแนนก่อนคูณตัวถ่วง */
    private BigDecimal precisionScore;

    /** ตัวถ่วงตามจำนวนทักษะที่จับคู่ได้: 0 ตัว = 0.0, 1 ตัว = 0.3, 2 ตัว = 0.6, ตั้งแต่ 3 ตัวขึ้นไป = 1.0 */
    private BigDecimal penaltyFactor;

    /** เหตุผลที่ได้คะแนนเท่านี้ ใช้ต่างกรณีกัน เช่นตอนที่คะแนนเป็น 0 เพราะหาทักษะมาตรฐานไม่เจอ */
    private String reason;

    // ===== B2 (optional) =====
    /** รายละเอียดการจับคู่ทีละทักษะ */
    private List<SkillMatchDetail> matchDetails;

    /** ทักษะมาตรฐานที่ถูกจับคู่ได้ (ใช้คำนวณ missing skills ของแต่ละอาชีพ) */
    private List<String> coveredStandardSkills;

    /** SEMANTIC = ใช้ LLM ช่วย, WORD_ONLY = ปิดไว้, WORD_FALLBACK = LLM ใช้ไม่ได้เลยถอยกลับมาจับคู่ด้วยคำ */
    private String matchMethod;
}
