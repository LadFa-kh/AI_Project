"use client";

// "สายงานที่เหมาะกับคุณ" — B1 careerMatches (API_CHANGES.md §5.1).
// Only rendered when the backend sends careerMatches, i.e. the user left the
// desired-role field empty and the system picked roles for them. Shows the
// top 1–4 roles as horizontal percent bars (percents come from the backend,
// already sum to 100 — never recomputed here); the user ticks a role to see
// the skills they already have and the ones still missing for it.

import { useId, useState } from "react";
import { InsightChipList } from "@/components/ui/insight-chip-list";
import type { CareerMatch } from "@/lib/assessment-service";
import styles from "./evaluation-result.module.css";

export function CareerMatchRanking({ matches }: { matches: CareerMatch[] }) {
  const [selected, setSelected] = useState(0);
  const groupName = useId();

  if (matches.length === 0) return null;
  const current = matches[Math.min(selected, matches.length - 1)];

  return (
    <section className={`${styles.careerBlock} ${styles.animateIn} ${styles.delay2}`} aria-labelledby={`${groupName}-title`}>
      <div className={styles.careerHead}>
        <h2 id={`${groupName}-title`} className={styles.careerTitle}>
          สายงานที่เหมาะกับคุณ
        </h2>
        <p className={styles.careerSub}>
          คุณไม่ได้ระบุตำแหน่งงาน ระบบจึงวิเคราะห์สายงานที่ใกล้เคียงกับทักษะของคุณมากที่สุด
          เลือกสายงานเพื่อดูทักษะที่มีแล้วและทักษะที่ยังขาด
        </p>
      </div>

      <div className={styles.careerList} role="radiogroup" aria-labelledby={`${groupName}-title`}>
        {matches.map((m, i) => {
          const active = i === selected;
          return (
            <label
              key={m.roleName}
              className={`${styles.careerRow} ${active ? styles.careerRowActive : ""}`}
            >
              <input
                type="radio"
                name={groupName}
                className={styles.careerRadio}
                checked={active}
                onChange={() => setSelected(i)}
              />
              <span className={styles.careerRank} aria-hidden="true">
                {i + 1}
              </span>
              <span className={styles.careerMain}>
                <span className={styles.careerNameRow}>
                  <span className={styles.careerName}>
                    {m.roleNameTh || m.roleName}
                    {m.roleNameTh && <span className={styles.careerNameEn}>{m.roleName}</span>}
                  </span>
                  {i === 0 && <span className={styles.careerBestTag}>เหมาะที่สุด</span>}
                </span>
                <span className={styles.careerBarTrack} aria-hidden="true">
                  <span
                    className={`${styles.careerBarFill} ${i === 0 ? styles.careerBarFillTop : ""}`}
                    style={{ width: `${Math.max(0, Math.min(100, m.percent))}%` }}
                  />
                </span>
              </span>
              <span className={styles.careerPercent}>{m.percent}%</span>
            </label>
          );
        })}
      </div>

      <p className={styles.careerNote}>
        เปอร์เซ็นต์คือสัดส่วนความใกล้เคียงเมื่อเทียบระหว่างสายงานที่แสดง รวมกันเท่ากับ 100%
      </p>

      <div className={styles.careerDetail} aria-live="polite">
        <p className={styles.careerDetailTitle}>
          <span className={styles.careerDetailDot} aria-hidden="true" />
          {current.roleNameTh || current.roleName}
        </p>
        {current.missingSkills.length > 0 ? (
          <InsightChipList heading="ทักษะที่ยังขาด" items={current.missingSkills} tone="warning" />
        ) : (
          <p className={styles.careerComplete}>คุณมีทักษะครบตามมาตรฐานของสายงานนี้แล้ว</p>
        )}
        {current.matchedSkills.length > 0 && (
          <InsightChipList heading="ทักษะที่มีแล้ว" items={current.matchedSkills} tone="positive" />
        )}
      </div>
    </section>
  );
}
