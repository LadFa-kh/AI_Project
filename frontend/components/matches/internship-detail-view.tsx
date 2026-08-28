"use client";

// Full-page structure rebuilt to match the demo
// (seam-demo/internship-detail.html) — same page-chrome pattern as
// upload-resume-flow.tsx / skill-assessment-flow.tsx /
// evaluation-result-flow.tsx / internship-matches-flow.tsx (full-viewport
// particle canvas, decorative blobs), Nocturne palette.
//
// The demo also mocks a quick-facts grid (location/duration/headcount/
// deadline), a job description, and a qualifications list — those are
// intentionally NOT built here since the backend has no per-job detail
// endpoint yet (DisplayJob only carries jobId/companyName/positionName/
// jobType/requiredSkills/userFinalScore/matchedSkills/missingSkills). Only
// real fields are rendered; the lookup/fallback logic against
// match-session.ts / workplace-session.ts is unchanged from before.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RequiredSkillChip } from "./required-skill-chip";
import { readMatchById } from "@/lib/match-session";
import { readWorkplaceById } from "@/lib/workplace-session";
import type { InternshipDetail } from "@/lib/internship-detail-types";
import styles from "./match-detail.module.css";

type Status = "loading" | "not-found" | "success";

// ===== Particle field background — identical pattern to the rest of the
// flow (try/catch, full cleanup). =====
function useParticleCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    let raf = 0;
    let resizeHandler: (() => void) | null = null;
    try {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const COLORS = ["#7c3aed", "#ec4899", "#3b82f6"];
      type Particle = {
        x: number; y: number; r: number; speed: number; drift: number;
        color: string; opacity: number;
      };
      let particles: Particle[] = [];

      function resize() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      resizeHandler = resize;
      window.addEventListener("resize", resize);
      resize();

      function spawn(): Particle {
        return {
          x: Math.random() * canvas!.width,
          y: canvas!.height + 20,
          r: 1 + Math.random() * 2.5,
          speed: 0.3 + Math.random() * 0.6,
          drift: (Math.random() - 0.5) * 0.4,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          opacity: 0.15 + Math.random() * 0.35,
        };
      }

      const COUNT = 46;
      particles = Array.from({ length: COUNT }, () => {
        const p = spawn();
        p.y = Math.random() * canvas.height;
        return p;
      });

      function frame() {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p) => {
          p.y -= p.speed;
          p.x += p.drift;
          if (p.y < -20) Object.assign(p, spawn());
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        });
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
    } catch (e) {
      console.error("Particle init failed:", e);
    }

    return () => {
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [canvasRef]);
}

// Continuous red→yellow→green hue scale — same scoreToColor() used by
// MatchScoreRing on the list page, ported exactly so the score reads
// consistently between the list and this detail page.
function scoreToColor(score: number): string {
  const hue = Math.max(0, Math.min(100, score)) * 1.2;
  return `hsl(${hue}, 80%, 55%)`;
}

// Same job-specific match % derivation as match-card.tsx: matched / (matched
// + missing) skill counts, falling back to userFinalScore only when there's
// no skill overlap data to compute from at all.
function computeMatchPercent(detail: InternshipDetail): number | null {
  const matched = detail.matchedSkills?.length ?? 0;
  const missing = detail.missingSkills?.length ?? 0;
  const total = matched + missing;
  if (total > 0) return Math.round((matched / total) * 100);
  if (typeof detail.userFinalScore === "number") return Math.round(detail.userFinalScore);
  return null;
}

function HeaderScoreRing({ score }: { score: number }) {
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
      className={styles.headerScore}
      style={{ ["--pct" as string]: displayPct, ["--score-color" as string]: color }}
      role="img"
      aria-label={`ความสอดคล้อง ${score} เปอร์เซ็นต์`}
    >
      <div className={styles.headerScoreInner}>
        <span className={styles.headerScoreValue}>{score}%</span>
        <span className={styles.headerScoreLabel}>สอดคล้อง</span>
      </div>
    </div>
  );
}

export function InternshipDetailView({ internshipId }: { internshipId: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [detail, setDetail] = useState<InternshipDetail | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useParticleCanvas(canvasRef);

  // Looked up from whichever internship-matches list was held in
  // sessionStorage — there's no backend endpoint to fetch a single job by
  // id, so this only works if the list page was visited first in this tab.
  // Checks the matching-results store first (has score/skill data), falling
  // back to the "ทั้งหมด" /workplaces store (id-keyed, no score) if not found.
  useEffect(() => {
    const match = readMatchById(internshipId);
    if (match) {
      setDetail(match);
      setStatus("success");
      return;
    }
    const workplace = readWorkplaceById(internshipId);
    if (workplace) {
      setDetail({
        jobId: workplace.id,
        companyName: workplace.companyName,
        positionName: workplace.positionName,
        jobType: workplace.jobType,
        requiredSkills: workplace.requiredSkills,
      });
      setStatus("success");
      return;
    }
    setDetail(null);
    setStatus("not-found");
  }, [internshipId]);

  const matchPercent = detail ? computeMatchPercent(detail) : null;
  const hasScore = matchPercent !== null;
  const hasSkillChips = !!(detail?.matchedSkills?.length || detail?.missingSkills?.length);
  const hasRequiredSkills = !hasSkillChips && !!detail?.requiredSkills?.length;

  return (
    <div className={styles.page}>
      <canvas ref={canvasRef} className={styles.particleCanvas} aria-hidden="true" />
      <div className={styles.ambient} aria-hidden="true">
        <div className={`${styles.blob} ${styles.blobOne}`} />
        <div className={`${styles.blob} ${styles.blobTwo}`} />
      </div>

      <main className={styles.main}>
        <Link href="/internship-matches" className={`${styles.backLink} ${styles.animateIn} ${styles.delay1}`}>
          <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z" />
          </svg>
          กลับสู่รายการตำแหน่งที่แนะนำ
        </Link>

        {status === "loading" && (
          <div className={`${styles.detailCard} ${styles.animateIn} ${styles.delay2}`} aria-hidden="true">
            <div className={styles.skeletonLine} style={{ width: "60%", height: 22 }} />
            <div className={styles.skeletonLine} style={{ width: "35%" }} />
            <div className={styles.skeletonLine} style={{ width: "100%" }} />
            <div className={styles.skeletonLine} style={{ width: "90%" }} />
            <div className={styles.skeletonLine} style={{ width: "40%" }} />
          </div>
        )}

        {status === "not-found" && (
          <div className={`${styles.detailCard} ${styles.animateIn} ${styles.delay2}`}>
            <p className={styles.formError} role="alert">
              <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V72a8,8,0,0,1,16,0v64a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" />
              </svg>
              ไม่พบข้อมูลตำแหน่งนี้ — กรุณากลับไปที่หน้ารายการเพื่อดูใหม่อีกครั้ง
            </p>
            <Link href="/internship-matches" className={styles.ghostBtn}>
              กลับสู่รายการ
            </Link>
          </div>
        )}

        {status === "success" && detail && (
          <div className={styles.detailCard}>
            <div className={`${styles.headerRow} ${styles.animateIn} ${styles.delay2}`}>
              <div className={styles.headerTitleBlock}>
                <h1 className={styles.titleText}>{detail.positionName}</h1>
                <p className={styles.companyText}>{detail.companyName}</p>
                {detail.jobType && <span className={styles.jobTypeBadge}>{detail.jobType}</span>}
              </div>
              {hasScore && <HeaderScoreRing score={matchPercent as number} />}
            </div>

            <div className={`${styles.animateIn} ${styles.delay3}`}>
              <h2 className={styles.sectionHeading}>ทักษะ</h2>
              <div className={styles.skillChipRow}>
                {detail.matchedSkills?.map((skill) => (
                  <span key={`matched-${skill}`} className={styles.chipHoverable}>
                    <RequiredSkillChip skill={skill} isMatch />
                  </span>
                ))}
                {detail.missingSkills?.map((skill) => (
                  <span key={`missing-${skill}`} className={styles.chipHoverable}>
                    <RequiredSkillChip skill={skill} isMatch={false} />
                  </span>
                ))}
                {hasRequiredSkills &&
                  detail.requiredSkills?.map((skill) => (
                    <span key={`required-${skill}`} className={styles.chipHoverable}>
                      <RequiredSkillChip skill={skill} isMatch="neutral" />
                    </span>
                  ))}
              </div>
            </div>

            <div className={`${styles.animateIn} ${styles.delay4}`}>
              <p className={styles.bodyText}>
                รายละเอียดเพิ่มเติม (คำอธิบายงาน สถานที่ ระยะเวลา ลิงก์สมัคร) ยังไม่พร้อมใช้งาน
                เนื่องจาก backend ยังไม่มี endpoint สำหรับข้อมูลเชิงลึกของแต่ละตำแหน่ง
              </p>
            </div>

            <div className={`${styles.ctaRow} ${styles.animateIn} ${styles.delay5}`}>
              <Link href="/internship-matches" className={styles.ghostBtn}>
                กลับสู่รายการ
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
