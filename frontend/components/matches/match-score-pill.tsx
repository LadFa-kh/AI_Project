import { getScoreLevel, SCORE_LEVEL_COLOR, SCORE_LEVEL_LABEL } from "@/lib/result-types";
import nocturne from "@/components/ui/nocturne.module.css";

type MatchScorePillProps = {
  score: number;
};

/** Compact score pill for list cards — reuses the same color scale as the ScoreBadge ring.
 *  Numeric score + level text are both shown, so fit is never conveyed by color alone. */
export function MatchScorePill({ score }: MatchScorePillProps) {
  const level = getScoreLevel(score);
  const color = SCORE_LEVEL_COLOR[level];

  return (
    <span
      className={nocturne.scorePill}
      style={{ color, background: `${color}26`, border: `1px solid ${color}66` }}
      aria-label={`Match score: ${score} percent, ${SCORE_LEVEL_LABEL[level]}`}
    >
      {score}% match
    </span>
  );
}
