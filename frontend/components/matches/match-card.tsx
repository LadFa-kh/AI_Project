"use client";

// Restyled to match the demo (seam-demo/internship-matches.html): a
// horizontal list row with a small animated score ring on the left
// (replacing the old MatchScorePill badge), instead of a grid card. All
// conditional logic is unchanged — cards built from /workplaces alone (the
// "ทั้งหมด" filter, no matching data merged in) still won't have a score or
// matched/missing skills, so those parts are hidden entirely rather than
// showing a fake "0% match" or empty chip row.

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DisplayJob } from "@/lib/internship-match-types";
import { RequiredSkillChip } from "./required-skill-chip";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import styles from "./matches-list.module.css";

type MatchCardProps = {
  match: DisplayJob;
  revealDelayMs?: number;
};

// Continuous red→yellow→green hue scale across the full 0-100 range —
// ported from the demo's scoreToColor() exactly, instead of ScoreBadge's
// 3-bucket discrete scale (developing/good/excellent). A list of several
// cards needs each score to read as visually distinct at a glance (e.g.
// 68% vs 71% vs 76% all landing in the same "good" bucket rendered
// identically before this fix); a single hero score elsewhere doesn't have
// that problem, which is why ScoreBadge intentionally uses the discrete
// scale with a text label instead. The numeric % is always shown as text
// here too, so level is still never conveyed by color alone.
function scoreToColor(score: number): string {
  const hue = Math.max(0, Math.min(100, score)) * 1.2;
  return `hsl(${hue}, 80%, 55%)`;
}

// Small per-card score ring — same conic-gradient technique as ScoreBadge
// on /evaluation-result, sized down for a list row. Kept local to this
// file rather than a shared component since nocturne.module.css's
// .scoreRing is sized for a single large usage.
function MatchScoreRing({ score }: { score: number }) {
  const color = scoreToColor(score);
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setDisplayPct(score));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [score]);

  return (
    <div
      className={styles.matchScore}
      style={{ ["--pct" as string]: displayPct, ["--score-color" as string]: color }}
      role="img"
      aria-label={`ความสอดคล้อง ${score} เปอร์เซ็นต์`}
    >
      <div className={styles.matchScoreInner}>
        <span className={styles.matchScoreValue}>{score}%</span>
        <span className={styles.matchScoreLabel}>สอดคล้อง</span>
      </div>
    </div>
  );
}

// The backend's userFinalScore is per-resume (resumeScore*0.6 +
// assessmentScore*0.4 — see assessment-service.ts), not per-job, so every
// card in the list was rendering the exact same number regardless of how
// well that specific job's required skills actually matched. Per explicit
// request, the ring instead shows a job-specific % computed from the skill
// overlap the backend already returns for each match: matched / (matched +
// missing). Falls back to userFinalScore only when there are no skill
// counts to compute from at all (shouldn't normally happen for a scored
// match, but keeps the ring from silently disappearing if it does).
function computeMatchPercent(match: DisplayJob): number | null {
  const matched = match.matchedSkills?.length ?? 0;
  const missing = match.missingSkills?.length ?? 0;
  const total = matched + missing;
  if (total > 0) return Math.round((matched / total) * 100);
  if (typeof match.userFinalScore === "number") return Math.round(match.userFinalScore);
  return null;
}

export function MatchCard({ match, revealDelayMs = 0 }: MatchCardProps) {
  const matchPercent = computeMatchPercent(match);
  const hasScore = matchPercent !== null;
  const hasSkillChips = !!(match.matchedSkills?.length || match.missingSkills?.length);
  const hasRequiredSkills = !hasSkillChips && !!match.requiredSkills?.length;

  return (
    <ScrollReveal delayMs={revealDelayMs}>
      <div className={styles.matchCard}>
        {hasScore && <MatchScoreRing score={matchPercent as number} />}

        <div className={styles.matchBody}>
          <h3 className={styles.matchTitle}>{match.positionName}</h3>
          <p className={styles.matchCompany}>
            {match.companyId ? (
              <Link href={`/companies/${match.companyId}`} className={styles.companyLink}>
                {match.companyName}
              </Link>
            ) : (
              match.companyName
            )}
          </p>

          {hasSkillChips && (
            <div className={`${styles.matchSkills} ${styles.chipHoverable}`}>
              {match.matchedSkills?.map((skill) => (
                <RequiredSkillChip key={`matched-${skill}`} skill={skill} isMatch ai={match.aiMatchedSkills?.includes(skill)} />
              ))}
              {match.missingSkills?.map((skill) => (
                <RequiredSkillChip key={`missing-${skill}`} skill={skill} isMatch={false} />
              ))}
            </div>
          )}

          {hasRequiredSkills && (
            <div className={`${styles.matchSkills} ${styles.chipHoverable}`}>
              {match.requiredSkills?.map((skill) => (
                <RequiredSkillChip key={`required-${skill}`} skill={skill} isMatch="neutral" />
              ))}
            </div>
          )}
        </div>

        <Link href={`/internship-matches/${match.jobId}`} className={styles.detailLink}>
          ดูรายละเอียด
        </Link>
      </div>
    </ScrollReveal>
  );
}
