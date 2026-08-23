"use client";

// Full-page structure rebuilt to match the standalone demo
// (seam-demo/upload-resume.html) exactly, per explicit request — this is
// NOT the shared glassmorphism-card shell used by /login, /register,
// /skill-assessment anymore. No intro/landing screen (the demo goes
// straight to the dropzone) — StepIntroScreen is no longer used here.
//
// All real business logic (API call, validation, error handling, session
// hand-off to /skill-assessment) lives in ResumeUploadCard, untouched by
// this restructure — this file only owns the page-level chrome: particle
// canvas background, decorative blobs, split-word heading, and mounting
// the StepIndicator + card content.
//
// This route is NOT in AppShell's NO_NAV_ROUTES, so the sidebar navbar
// renders around this page automatically — no navbar markup needed here.

import { useEffect, useMemo, useRef } from "react";
import { ResumeUploadCard } from "./resume-upload-card";
import styles from "./resume-upload.module.css";

const HEADING = "อัปโหลดเรซูเม่ของคุณ เริ่มต้นเส้นทางฝึกงาน";

// ===== Particle field background — same defensive pattern (try/catch,
// full cleanup) used on /login and Home's hero. =====
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

// ===== Word-by-word split heading — fades/slides in once on mount, no
// loop (matches the demo: heading is short, a one-shot reveal reads
// better than a repeating animation while the user is about to upload). =====
function SplitHeading({ text }: { text: string }) {
  const words = useMemo(() => text.split(" "), [text]);
  return (
    <h1 className={styles.splitHeading}>
      {words.map((w, i) => (
        <span
          key={i}
          className={styles.splitWord}
          style={{ animationDelay: `${i * 0.09}s` }}
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </h1>
  );
}

export function UploadResumeFlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useParticleCanvas(canvasRef);

  return (
    <div className={styles.page}>
      <canvas ref={canvasRef} className={styles.particleCanvas} aria-hidden="true" />
      <div className={styles.ambient} aria-hidden="true">
        <div className={`${styles.blob} ${styles.blobOne}`} />
        <div className={`${styles.blob} ${styles.blobTwo}`} />
      </div>

      <main className={styles.main}>
        <div className={`${styles.eyebrow} ${styles.animateIn}`}>AI_PROJECT — UPLOAD RESUME</div>
        <SplitHeading text={HEADING} />
        <p className={`${styles.subtitle} ${styles.animateIn} ${styles.delay3}`}>
          อัปโหลดเรซูเม่ของคุณ ให้ AI ช่วยประเมินทักษะและแนะนำที่ฝึกงานที่เหมาะกับคุณที่สุด
        </p>

        <ResumeUploadCard />
      </main>
    </div>
  );
}
