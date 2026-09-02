"use client";

// การ์ดแสดงที่มาของคะแนน — ตอบคำถามว่าคะแนนที่เห็นคิดมาจากอะไรบ้าง
//
// เดิมหน้าผลการประเมินแสดงแค่ตัวเลขสามตัว (คะแนนรวม คะแนนเรซูเม่ คะแนนแบบประเมิน)
// โดยไม่มีที่มา ทั้งผู้ใช้ ทีมงาน และอาจารย์จึงตรวจสอบย้อนกลับไม่ได้ว่าคิดอย่างไร
//
// ข้อกำหนดสำคัญ: ตัวเลขทุกค่าที่แสดงในไฟล์นี้มาจาก scoreBreakdown ที่หลังบ้าน
// คำนวณมาแล้วทั้งหมด ห้ามคำนวณซ้ำในหน้าเว็บเด็ดขาด แม้แต่การคูณง่าย ๆ อย่าง
// resumeScore x resumeWeight ก็ใช้ค่า resumeContribution ที่ส่งมาแทน เพราะถ้า
// วันหนึ่งสูตรฝั่งหลังบ้านเปลี่ยน (เช่น ปรับน้ำหนัก หรือเพิ่มองค์ประกอบที่สาม)
// ตัวเลขบนหน้าจอจะเปลี่ยนตามเองโดยไม่ต้องแก้ไฟล์นี้ และไม่มีทางที่สองฝั่งจะไม่ตรงกัน
//
// สิ่งเดียวที่ไฟล์นี้ทำกับตัวเลขคือการจัดรูปแบบทศนิยมเพื่อให้อ่านง่าย

import type { ScoreBreakdown } from "@/lib/assessment-service";
import styles from "./evaluation-result.module.css";

/** ตัดทศนิยม .00 ที่ไม่จำเป็นออก แต่คงทศนิยมไว้เมื่อมีค่าจริง (58.00 -> 58, 58.50 -> 58.5) */
function fmt(n: number): string {
  if (!Number.isFinite(n)) return "-";
  return Number(n.toFixed(2)).toString();
}

/** แปลงน้ำหนัก 0.6 เป็น 60% เพื่อให้ผู้ใช้ทั่วไปเข้าใจง่ายกว่าตัวคูณทศนิยม */
function pct(weight: number): string {
  if (!Number.isFinite(weight)) return "-";
  return `${Number((weight * 100).toFixed(2))}%`;
}

export function ScoreBreakdownCard({ breakdown }: { breakdown: ScoreBreakdown }) {
  const b = breakdown;
  const matchedCount = b.matchedSkills?.length ?? 0;
  const unmatchedCount = b.unmatchedSkills?.length ?? 0;

  // ตัวถ่วงน้อยกว่า 1 แปลว่าคะแนนถูกลดลงเพราะจับคู่ทักษะได้น้อย ต้องอธิบายให้ชัด
  // ไม่งั้นผู้ใช้จะงงว่าทำไมคำนวณแล้วไม่ตรงกับที่เห็น
  const hasPenalty = b.penaltyFactor > 0 && b.penaltyFactor < 1;

  // ไม่พบทักษะมาตรฐานในฐานข้อมูล = ระบบเทียบให้ไม่ได้ ซึ่งคนละเรื่องกับ
  // "ผู้ใช้ไม่มีทักษะที่ตรง" แต่ทั้งสองกรณีได้ 0 เหมือนกัน จึงต้องแยกข้อความ
  const cannotCompare = b.totalStandardSkills === 0;

  return (
    <div className={styles.breakdownCard}>
      <div className={styles.breakdownHeader}>
        <span className={styles.breakdownTitle}>คะแนนนี้คิดมาจากอะไร</span>
      </div>
      <p className={styles.breakdownNote}>
        เทียบกับตำแหน่ง <strong>{b.roleUsedForMatching}</strong>
        {b.roleInferredByAi
          ? " ซึ่งระบบวิเคราะห์ให้จากทักษะในเรซูเม่ เนื่องจากคุณไม่ได้ระบุตำแหน่งงานไว้"
          : " ตามที่คุณระบุไว้"}
      </p>

      {/* ---------- ส่วนที่ 1 คะแนนเรซูเม่ ---------- */}
      <div className={styles.breakdownStep}>
        <div className={styles.breakdownStepHead}>
          <span className={styles.breakdownStepTitle}>
            1. คะแนนเรซูเม่ · น้ำหนัก {pct(b.resumeWeight)}
          </span>
          <span className={styles.breakdownStepValue}>{fmt(b.resumeScore)} / 100</span>
        </div>

        <div className={styles.breakdownRow}>
          <span className={styles.breakdownRowLabel}>ทักษะที่พบในเรซูเม่</span>
          <span className={styles.breakdownRowValue}>{b.totalResumeSkills} รายการ</span>
        </div>
        <div className={styles.breakdownRow}>
          <span className={styles.breakdownRowLabel}>ทักษะมาตรฐานของตำแหน่งนี้ (O*NET)</span>
          <span className={styles.breakdownRowValue}>{b.totalStandardSkills} รายการ</span>
        </div>
        <div className={styles.breakdownRow}>
          <span className={styles.breakdownRowLabel}>จับคู่กันได้</span>
          <span className={styles.breakdownRowValue}>{matchedCount} รายการ</span>
        </div>

        {cannotCompare ? (
          <p className={styles.breakdownWarn}>
            ระบบยังไม่พบทักษะมาตรฐานของตำแหน่งนี้ในฐานข้อมูล O*NET จึงยังเทียบทักษะให้ไม่ได้
            คะแนนส่วนนี้จึงเป็น 0 ซึ่งไม่ได้แปลว่าคุณไม่มีทักษะ ลองระบุชื่อตำแหน่งงานให้ใกล้เคียง
            ชื่ออาชีพมาตรฐานมากขึ้นแล้วประเมินใหม่
          </p>
        ) : (
          <>
            <p className={styles.breakdownFormula}>
              ({matchedCount} ÷ {b.totalResumeSkills}) × 100 = {fmt(b.precisionScore)}
              {hasPenalty && <> แล้วคูณ {fmt(b.penaltyFactor)} = {fmt(b.resumeScore)}</>}
            </p>
            {hasPenalty && (
              <p className={styles.breakdownReason}>
                จับคู่ทักษะได้เพียง {matchedCount} รายการ ระบบจึงลดคะแนนลงด้วยตัวคูณ{" "}
                {fmt(b.penaltyFactor)} เพื่อไม่ให้คะแนนสูงเกินจริง เมื่อจับคู่ได้ตั้งแต่ 3 รายการขึ้นไป
                จะไม่มีการลดคะแนนส่วนนี้
              </p>
            )}
            {matchedCount > 0 && (
              <div className={styles.breakdownSkillRow}>
                {b.matchedSkills.map((s) => (
                  <span
                    key={`m-${s}`}
                    className={`${styles.breakdownSkill} ${styles.breakdownSkillMatched}`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
            {unmatchedCount > 0 && (
              <>
                <p className={styles.breakdownReason}>
                  ทักษะอีก {unmatchedCount} รายการนี้ไม่ตรงกับทักษะมาตรฐานของตำแหน่งนี้
                  แต่ยังถูกนับเป็นตัวหาร จึงมีผลทำให้คะแนนส่วนนี้ลดลง
                </p>
                <div className={styles.breakdownSkillRow}>
                  {b.unmatchedSkills.map((s) => (
                    <span
                      key={`u-${s}`}
                      className={`${styles.breakdownSkill} ${styles.breakdownSkillUnmatched}`}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ---------- ส่วนที่ 2 คะแนนแบบประเมินตนเอง ---------- */}
      <div className={styles.breakdownStep}>
        <div className={styles.breakdownStepHead}>
          <span className={styles.breakdownStepTitle}>
            2. คะแนนแบบประเมินตนเอง · น้ำหนัก {pct(b.assessmentWeight)}
          </span>
          <span className={styles.breakdownStepValue}>{fmt(b.assessmentScore)} / 100</span>
        </div>
        <div className={styles.breakdownRow}>
          <span className={styles.breakdownRowLabel}>
            ตอบ {b.answeredQuestions} ข้อ ข้อละไม่เกิน {b.maxScorePerQuestion} คะแนน
          </span>
          <span className={styles.breakdownRowValue}>
            {b.totalScoreObtained} / {b.maxPossibleScore}
          </span>
        </div>
        <p className={styles.breakdownFormula}>
          ({b.totalScoreObtained} ÷ {b.maxPossibleScore}) × 100 = {fmt(b.assessmentScore)}
        </p>
      </div>

      {/* ---------- ส่วนที่ 3 รวมคะแนน ---------- */}
      <div className={styles.breakdownStep}>
        <div className={styles.breakdownStepHead}>
          <span className={styles.breakdownStepTitle}>3. รวมคะแนนตามน้ำหนัก</span>
        </div>
        <div className={styles.breakdownRow}>
          <span className={styles.breakdownRowLabel}>
            จากเรซูเม่ · {fmt(b.resumeScore)} × {pct(b.resumeWeight)}
          </span>
          <span className={styles.breakdownRowValue}>{fmt(b.resumeContribution)}</span>
        </div>
        <div className={styles.breakdownRow}>
          <span className={styles.breakdownRowLabel}>
            จากแบบประเมิน · {fmt(b.assessmentScore)} × {pct(b.assessmentWeight)}
          </span>
          <span className={styles.breakdownRowValue}>{fmt(b.assessmentContribution)}</span>
        </div>
        <div className={styles.breakdownTotal}>
          <span className={styles.breakdownTotalLabel}>คะแนนรวม</span>
          <span className={styles.breakdownTotalValue}>{fmt(b.finalScore)} / 100</span>
        </div>
      </div>
    </div>
  );
}
