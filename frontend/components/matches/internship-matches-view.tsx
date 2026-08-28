"use client";

// Restyled to match the demo (seam-demo/internship-matches.html) — page-level
// chrome (particle canvas, blobs, split heading) now lives in
// internship-matches-flow.tsx, which mounts this component for the actual
// content. All business logic below (filter mode "ตรงกับคุณ"/"ทั้งหมด",
// multi-skill AND filter, matching/workplaces API calls, skeleton loading,
// error/empty states) is 100% unchanged from before this restyle — only the
// JSX class names changed, from the old grid-card layout to the demo's
// vertical list + score-ring card design (see MatchCard).

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getMatchingRecommendations, type InternshipMatch } from "@/lib/matching-service";
import { getAllWorkplaces, type Workplace } from "@/lib/workplace-service";
import { readAssessmentResult } from "@/lib/assessment-session";
import { writeMatchList } from "@/lib/match-session";
import { writeWorkplaceList } from "@/lib/workplace-session";
import type { DisplayJob } from "@/lib/internship-match-types";
import { useAuth } from "@/lib/auth-context";
import { MatchCard } from "./match-card";
import { MatchSkeletonCard } from "./match-skeleton-card";
import { MatchesControlBar, type MatchFilterMode } from "./matches-control-bar";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import fieldStyles from "@/components/resume/resume-upload.module.css";
import styles from "./matches-list.module.css";

type Status = "loading" | "no-assessment" | "error" | "success";

export function InternshipMatchesView() {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [matches, setMatches] = useState<InternshipMatch[]>([]);
  // Separate load state for the "ทั้งหมด" (/workplaces) list — this is not
  // tied to the user's assessment, so it loads independently and lazily
  // (only once the user actually switches to "all", to avoid an unneeded
  // fetch when they never leave the default "matching" filter).
  const [workplaces, setWorkplaces] = useState<Workplace[] | null>(null);
  const [workplacesStatus, setWorkplacesStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [filterMode, setFilterMode] = useState<MatchFilterMode>("matching");
  // Multiple skills can be selected at once — AND semantics (a job must
  // have every selected skill, not just one) applied in visibleMatches below.
  const [activeSkills, setActiveSkills] = useState<string[]>([]);
  const toggleSkill = useCallback((skill: string) => {
    setActiveSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }, []);
  const clearSkills = useCallback(() => setActiveSkills([]), []);

  const load = useCallback(async () => {
    setStatus("loading");

    // resumeId comes from the skill-assessment step's sessionStorage
    // hand-off — matching only works after that resume's assessment has
    // been submitted, so if we don't have it, there's nothing to fetch yet.
    const assessment = readAssessmentResult();
    if (!user || !assessment) {
      setStatus("no-assessment");
      return;
    }

    try {
      const result = await getMatchingRecommendations(assessment.resumeId);
      setMatches(result);
      // So the detail page (which has no backend endpoint of its own) can
      // look a job up by id without a separate fetch.
      writeMatchList(result);
      setStatus("success");
    } catch {
      // KNOWN BACKEND BUG (README §6): /matching/recommendations returns a
      // bodyless 500 for every failure, including the normal "assessment
      // not done yet" case — can't tell those apart, so the message below
      // stays deliberately non-committal rather than claiming a hard error.
      setStatus("error");
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // GET /workplaces has no per-user scoring, so unlike the matching call
  // above it doesn't need an assessment — it's fetched independently the
  // first time the user switches to "ทั้งหมด".
  useEffect(() => {
    if (filterMode !== "all" || workplacesStatus !== "idle") return;
    setWorkplacesStatus("loading");
    getAllWorkplaces()
      .then((result) => {
        setWorkplaces(result);
        writeWorkplaceList(result);
        setWorkplacesStatus("success");
      })
      .catch(() => setWorkplacesStatus("error"));
  }, [filterMode, workplacesStatus]);

  // Merge matching data (score/matchedSkills/missingSkills) into a workplace
  // row when the same job also appears in the matching results, so "ทั้งหมด"
  // still shows fit info for jobs the user has been scored against.
  const matchByJobId = useMemo(() => {
    const map = new Map<string, InternshipMatch>();
    matches.forEach((m) => map.set(m.jobId, m));
    return map;
  }, [matches]);

  const allJobs: DisplayJob[] = useMemo(() => {
    if (!workplaces) return [];
    return workplaces.map((w) => {
      const scored = matchByJobId.get(w.id);
      return {
        jobId: w.id,
        companyName: w.companyName,
        positionName: w.positionName,
        jobType: w.jobType,
        requiredSkills: w.requiredSkills,
        userFinalScore: scored?.userFinalScore,
        matchedSkills: scored?.matchedSkills,
        missingSkills: scored?.missingSkills,
      };
    });
  }, [workplaces, matchByJobId]);

  const skillOptions = useMemo(() => {
    const set = new Set<string>();
    if (filterMode === "all") {
      allJobs.forEach((j) => (j.matchedSkills ?? j.requiredSkills)?.forEach((s) => set.add(s)));
    } else {
      matches.forEach((m) => m.matchedSkills.forEach((s) => set.add(s)));
    }
    return Array.from(set).sort();
  }, [matches, allJobs, filterMode]);

  const visibleMatches: DisplayJob[] = useMemo(() => {
    // Dropdown: "Matching" (default) = jobs from the user's scored matching
    // results with at least one matched skill. "All" = every workplace from
    // GET /workplaces, scored fields merged in where available. Chips:
    // narrow further by skill — a job must have EVERY selected skill (AND),
    // not just one. Backend already sorts matching results by fit
    // (userFinalScore desc), so that order is preserved rather than
    // re-sorted here.
    if (filterMode === "all") {
      let result = allJobs;
      if (activeSkills.length > 0) {
        result = result.filter((j) => {
          const skills = j.matchedSkills ?? j.requiredSkills ?? [];
          return activeSkills.every((s) => skills.includes(s));
        });
      }
      return result;
    }
    let result: DisplayJob[] = matches.filter((m) => m.matchedSkills.length > 0);
    if (activeSkills.length > 0) {
      // `result` is typed as DisplayJob[] (matchedSkills optional) even
      // though it's actually InternshipMatch[] data at this point — same
      // `?? []` fallback pattern as the "all" branch above, not a real
      // runtime possibility here since the .length > 0 filter just above
      // already guarantees every item has a non-empty matchedSkills array.
      result = result.filter((m) => activeSkills.every((s) => (m.matchedSkills ?? []).includes(s)));
    }
    return result;
  }, [matches, allJobs, filterMode, activeSkills]);

  return (
    <div className={styles.viewWrap}>
      {/* "no-assessment"/"error" here only block the default "matching"
          filter — "ทั้งหมด" doesn't depend on the assessment, so the user
          can still switch to it via the control bar below even when
          matching has nothing to show. */}
      {filterMode === "matching" && status === "no-assessment" && (
        <div className={`${styles.emptyBlock} ${styles.animateIn}`}>
          <h2 className={fieldStyles.heading} style={{ fontSize: 18 }}>
            ยังไม่พบผลการประเมิน
          </h2>
          <p className={fieldStyles.subheading}>
            กรุณาทำแบบประเมินทักษะให้เสร็จก่อน ระบบจะแนะนำที่ฝึกงานที่เหมาะกับคุณให้
          </p>
          <Link href="/skill-assessment" className={fieldStyles.submitBtn} style={{ maxWidth: 240, marginTop: 12 }}>
            ไปหน้าแบบประเมินทักษะ
          </Link>
        </div>
      )}

      {filterMode === "matching" && status === "error" && (
        <div className={styles.animateIn}>
          <p className={fieldStyles.formError} role="alert">
            <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V72a8,8,0,0,1,16,0v64a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" />
            </svg>
            เรียกข้อมูลไม่สำเร็จ — อาจเป็นเพราะยังไม่ได้ทำแบบประเมิน หรือเกิดข้อผิดพลาดชั่วคราว
          </p>
          <button type="button" onClick={load} className={fieldStyles.submitBtn} style={{ maxWidth: 200, marginTop: 12 }}>
            ลองใหม่
          </button>
        </div>
      )}

      {filterMode === "all" && workplacesStatus === "error" && (
        <div className={styles.animateIn}>
          <p className={fieldStyles.formError} role="alert">
            <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V72a8,8,0,0,1,16,0v64a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" />
            </svg>
            เรียกรายการที่ฝึกงานทั้งหมดไม่สำเร็จ กรุณาลองใหม่
          </p>
          <button
            type="button"
            onClick={() => setWorkplacesStatus("idle")}
            className={fieldStyles.submitBtn}
            style={{ maxWidth: 200, marginTop: 12 }}
          >
            ลองใหม่
          </button>
        </div>
      )}

      {((filterMode === "matching" && status === "loading") ||
        (filterMode === "all" && workplacesStatus === "loading")) && (
        <div className={styles.matchList}>
          {Array.from({ length: 4 }, (_, i) => (
            <MatchSkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Control bar (filter dropdown + skill chips) stays visible once the
          matching call has resolved at all, even with zero results, so the
          user can still reach "ทั้งหมด" from a "no-assessment"/empty state. */}
      {status !== "loading" && (
        <ScrollReveal delayMs={80}>
          <MatchesControlBar
            filterMode={filterMode}
            onFilterModeChange={setFilterMode}
            skillOptions={skillOptions}
            activeSkills={activeSkills}
            onSkillToggle={toggleSkill}
            onClearSkills={clearSkills}
          />
        </ScrollReveal>
      )}

      {filterMode === "matching" && status === "success" && matches.length === 0 && (
        <div className={`${styles.emptyBlock} ${styles.animateIn}`}>
          <span className={styles.emptyIcon} aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 256 256" fill="currentColor">
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z" />
            </svg>
          </span>
          <h2 className={fieldStyles.heading} style={{ fontSize: 18 }}>
            ยังไม่พบตำแหน่งที่ตรงกับคุณ
          </h2>
          <p className={fieldStyles.subheading}>
            ลองปรับผลการประเมินทักษะของคุณเพื่อค้นหาตำแหน่งที่เหมาะสมมากขึ้น
          </p>
        </div>
      )}

      {((filterMode === "matching" && status === "success" && matches.length > 0) ||
        (filterMode === "all" && workplacesStatus === "success" && allJobs.length > 0)) &&
        visibleMatches.length === 0 && (
          <div className={`${styles.emptyBlock} ${styles.animateIn}`}>
            <h2 className={fieldStyles.heading} style={{ fontSize: 18 }}>
              ไม่พบตำแหน่งที่ตรงกับตัวกรองนี้
            </h2>
            <p className={fieldStyles.subheading}>
              {filterMode === "all"
                ? "ลองเลือกทักษะอื่น"
                : 'ลองเลือกทักษะอื่น หรือเปลี่ยนเป็น "ทั้งหมด" เพื่อดูที่ฝึกงานทั้งหมด'}
            </p>
          </div>
        )}

      {visibleMatches.length > 0 && (
        <div className={styles.matchList}>
          {visibleMatches.map((match, index) => (
            <MatchCard
              key={match.jobId}
              match={match}
              revealDelayMs={(index % 3) * 80}
            />
          ))}
        </div>
      )}
    </div>
  );
}
