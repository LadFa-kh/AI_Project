import Link from "next/link";
import type { InternshipMatchSummary } from "@/lib/internship-match-types";
import nocturne from "@/components/ui/nocturne.module.css";
import { RequiredSkillChip } from "./required-skill-chip";

type MatchCardProps = {
  match: InternshipMatchSummary;
};

export function MatchCard({ match }: MatchCardProps) {
  return (
    <div className={nocturne.card} style={{ maxWidth: "none", gap: 12 }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className={nocturne.heading} style={{ fontSize: 15, textAlign: "left" }}>
            {match.title}
          </h3>
          <p className={nocturne.subheading} style={{ textAlign: "left" }}>{match.company}</p>
        </div>
        <span className={nocturne.scorePill} style={{ flex: "none" }}>
          {match.matchScore}% match
        </span>
      </div>

      <div className={nocturne.chipRow}>
        {match.requiredSkills.map((skill) => (
          <RequiredSkillChip key={skill} skill={skill} isMatch />
        ))}
      </div>

      <Link
        href={`/internship-matches/${match.internshipId}`}
        className={nocturne.ghostBtn}
        style={{ marginTop: 4 }}
      >
        ดูรายละเอียด
      </Link>
    </div>
  );
}
