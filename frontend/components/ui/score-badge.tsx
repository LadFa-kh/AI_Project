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
  const pct = Math.max(0, Math.min(100, (score / outOf) * 100));

  return (
    <div
      role="img"
      aria-label={`Overall score: ${score} out of ${outOf}, level: ${SCORE_LEVEL_LABEL[level]}`}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}
    >
      <div
        className={styles.scoreRing}
        style={{ ["--score-pct" as string]: pct, ["--score-color" as string]: color }}
      >
        <div className={styles.scoreRingInner}>
          <span className={styles.scoreValue}>{score}</span>
          <span className={styles.scoreOutOf}>out of {outOf}</span>
        </div>
      </div>
      <div className={styles.scoreBadge} style={{ color, background: `${color}26`, border: `1px solid ${color}66` }}>
        {SCORE_LEVEL_LABEL[level]}
      </div>
    </div>
  );
}
