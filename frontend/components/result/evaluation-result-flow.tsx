"use client";

// Full-page structure rebuilt to match the demo
// (seam-demo/evaluation-result.html) — same page-chrome pattern as
// upload-resume-flow.tsx / skill-assessment-flow.tsx (full-viewport
// particle canvas, no card wrapper, split-word heading), Nocturne palette,
// per explicit request to keep the whole upload → assessment → result flow
// visually consistent.
//
// All real business logic (reading the assessment-submit result from the
// skill-assessment step's session hand-off) lives in EvaluationResultCard,
// untouched by this restructure.

import { useEffect, useMemo, useRef } from "react";
import { StepIndicator } from "@/components/ui/step-indicator";
import { EvaluationResultCard } from "./evaluation-result-card";
import styles from "./evaluation-result.module.css";

const HEADING = "ผลการประเมินทักษะของคุณ";

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

// ===== Word-by-word split heading — one-shot reveal on mount =====
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

export function EvaluationResultFlow() {
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
        <div className={`${styles.eyebrow} ${styles.animateIn}`}>RESUMATE — EVALUATION RESULT</div>
        <SplitHeading text={HEADING} />

        <div className={`${styles.stepRow} ${styles.animateIn} ${styles.delay3}`}>
          <StepIndicator currentStep={3} totalSteps={3} label="ผลลัพธ์ของคุณ" />
        </div>

        <EvaluationResultCard />
      </main>
    </div>
  );
}
