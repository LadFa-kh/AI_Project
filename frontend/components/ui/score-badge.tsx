"use client";

import { useEffect, useState } from "react";
import {
  getScoreLevel,
  SCORE_LEVEL_COLOR,
  SCORE_LEVEL_LABEL,
} from "@/lib/result-types";
import styles from "./nocturne.module.css";

type ScoreBadgeProps = {
  score: number;
  outOf?: number;
};

/** Score ring + level badge, shared for evaluation-style score displays.
 *  Level is conveyed by both color and text label (not color alone) for accessibility. */
export function ScoreBadge({ score, outOf = 100 }: ScoreBadgeProps) {
  const level = getScoreLevel(score);
  const color = SCORE_LEVEL_COLOR[level];
  const targetPct = Math.max(0, Math.min(100, (score / outOf) * 100));

  // Ring starts at 0 and animates up to the real score on mount (the CSS
  // transition on --score-pct only fires on a value change, not on first
  // paint) — a small "count-up" moment that makes landing on the result
  // page feel more like a reveal than a static readout.
  const [displayPct, setDisplayPct] = useState(0);
  useEffect(() => {
    // Double rAF: a single rAF can still land in the same paint as the
    // initial 0 value in some browsers, which skips the CSS transition
    // entirely (the "from" and "to" states never get separately painted).
    // Waiting a full extra frame guarantees the 0 state has actually
    // painted before the change to targetPct, so the transition fires.
    let innerFrame = 0;
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => setDisplayPct(targetPct));
    });
    return () => {
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
    };
  }, [targetPct]);

  return (
    <div
      role="img"
      aria-label={`คะแนนรวม: ${score} จาก ${outOf}, ระดับ: ${SCORE_LEVEL_LABEL[level]}`}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}
    >
      <div
        className={styles.scoreRing}
        style={{ ["--score-pct" as string]: displayPct, ["--score-color" as string]: color }}
      >
        <div className={styles.scoreRingInner}>
          <span className={styles.scoreValue}>{score}</span>
          <span className={styles.scoreOutOf}>จาก {outOf}</span>
        </div>
      </div>
      <div className={styles.scoreBadge} style={{ color, background: `${color}26`, border: `1px solid ${color}66` }}>
        {SCORE_LEVEL_LABEL[level]}
      </div>
    </div>
  );
}
