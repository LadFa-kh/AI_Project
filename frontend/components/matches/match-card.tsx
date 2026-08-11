import Link from "next/link";
import type { InternshipMatchSummary } from "@/lib/internship-match-types";
import { MatchScorePill } from "./match-score-pill";
import { RequiredSkillChip } from "./required-skill-chip";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import styles from "./matches-list.module.css";

type MatchCardProps = {
  match: InternshipMatchSummary;
  revealDelayMs?: number;
};

export function MatchCard({ match, revealDelayMs = 0 }: MatchCardProps) {
  return (
    <ScrollReveal delayMs={revealDelayMs}>
      <div className={styles.matchCard}>
        <div className={styles.matchCardTop}>
          <div className={styles.matchCardTitleBlock}>
            <h3 className={styles.matchTitle}>{match.title}</h3>
            <p className={styles.matchCompany}>{match.company}</p>
          </div>
          <span className={styles.chipHoverable}>
            <MatchScorePill score={match.matchScore} />
          </span>
        </div>

        <div className={styles.chipHoverable} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {match.requiredSkills.map((skill) => (
            <RequiredSkillChip key={skill} skill={skill} isMatch />
          ))}
        </div>

        <Link
          href={`/internship-matches/${match.internshipId}`}
          className={styles.detailLink}
        >
          View details
        </Link>
      </div>
    </ScrollReveal>
  );
}
