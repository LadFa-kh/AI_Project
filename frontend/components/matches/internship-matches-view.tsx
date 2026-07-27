"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MOCK_MATCH_SUMMARIES,
  type InternshipMatchSummary,
  type MatchSortOption,
} from "@/lib/internship-match-types";
import { MatchCard } from "./match-card";
import { MatchSkeletonCard } from "./match-skeleton-card";
import { MatchesControlBar } from "./matches-control-bar";
import nocturne from "@/components/ui/nocturne.module.css";
import styles from "./matches-list.module.css";

type Status = "loading" | "error" | "success";

export function InternshipMatchesView() {
  const [status, setStatus] = useState<Status>("loading");
  const [matches, setMatches] = useState<InternshipMatchSummary[]>([]);
  const [sort, setSort] = useState<MatchSortOption>("matchScore");
  const [activeSkill, setActiveSkill] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      // TODO: wire to backend — GET /internships/matches?assessmentId=<id>
      // -> { matches: [{ internshipId, title, company, matchScore, requiredSkills }], total } (see PROJECT_CONTEXT.md)
      await new Promise<InternshipMatchSummary[]>((resolve) =>
        setTimeout(() => resolve(MOCK_MATCH_SUMMARIES), 900)
      );
      setMatches(MOCK_MATCH_SUMMARIES);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const skillOptions = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => m.requiredSkills.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [matches]);

  const visibleMatches = useMemo(() => {
    let result = matches;
    if (activeSkill) {
      result = result.filter((m) => m.requiredSkills.includes(activeSkill));
    }
    return [...result].sort((a, b) =>
      sort === "matchScore"
        ? b.matchScore - a.matchScore
        : a.company.localeCompare(b.company)
    );
  }, [matches, sort, activeSkill]);

  return (
    <div className={nocturne.wideShell}>
      <div className={nocturne.wideContainer}>
        <div className={styles.headerRow}>
          <h1 className={styles.pageHeading}>Your internship matches</h1>
          <p className={styles.pageSubheading}>
            {status === "success"
              ? `Ranked by fit to your skill assessment · ${matches.length} match${matches.length === 1 ? "" : "es"} found`
              : "Ranked by fit to your skill assessment"}
          </p>
        </div>

        {status === "error" && (
          <p className={nocturne.formError} role="alert">
            <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V72a8,8,0,0,1,16,0v64a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" />
            </svg>
            We couldn&apos;t load your internship matches. Please try again.
          </p>
        )}
        {status === "error" && (
          <button type="button" onClick={load} className={nocturne.submitBtn} style={{ maxWidth: 200 }}>
            Retry
          </button>
        )}

        {status === "loading" && (
          <div className={styles.matchGrid}>
            {Array.from({ length: 4 }, (_, i) => (
              <MatchSkeletonCard key={i} />
            ))}
          </div>
        )}

        {status === "success" && matches.length > 0 && (
          <MatchesControlBar
            sort={sort}
            onSortChange={setSort}
            skillOptions={skillOptions}
            activeSkill={activeSkill}
            onSkillChange={setActiveSkill}
          />
        )}

        {status === "success" && matches.length === 0 && (
          <div className={styles.emptyBlock}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 256 256" fill="currentColor">
                <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z" />
              </svg>
            </span>
            <h2 className={nocturne.heading} style={{ fontSize: 18 }}>
              No matches yet
            </h2>
            <p className={nocturne.subheading}>
              Try updating your skill assessment to find more relevant matches.
            </p>
          </div>
        )}

        {status === "success" && matches.length > 0 && visibleMatches.length === 0 && (
          <div className={styles.emptyBlock}>
            <h2 className={nocturne.heading} style={{ fontSize: 18 }}>
              No matches for this filter
            </h2>
            <p className={nocturne.subheading}>
              Try a different skill or clear the filter to see all matches.
            </p>
          </div>
        )}

        {status === "success" && visibleMatches.length > 0 && (
          <div className={styles.matchGrid}>
            {visibleMatches.map((match) => (
              <MatchCard key={match.internshipId} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
