"use client";

// Login/Register merged into one route (per explicit request), toggled via
// a sliding pill switch + 3D card-flip — ported from the standalone demo
// (seam-demo/login-register.html) into React/Next. LoginForm/RegisterForm
// and their validation/API logic are untouched; only the surrounding page
// chrome (navbar-less full-screen layout, particle background, blobs,
// split-word heading, mode toggle, card flip) changed.
//
// /register still exists as a route — it now just redirects here with
// ?mode=register so old bookmarks/links keep working (see
// app/register/page.tsx).
//
// This page can't carry `export const metadata` since it's now a client
// component (needs useState/useSearchParams for the mode toggle); the title
// set by RootLayout's default stays in effect instead.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import styles from "@/components/auth/login.module.css";

type Mode = "login" | "register";

const COPY: Record<Mode, { heading: string; subheading: string }> = {
  login: {
    heading: "ยินดีต้อนรับกลับ",
    subheading: "เข้าสู่ระบบเพื่อดำเนินการวิเคราะห์เรซูเม่และจับคู่ตำแหน่งฝึกงานต่อ",
  },
  register: {
    heading: "สร้างบัญชีของคุณ",
    subheading: "สมัครสมาชิกเพื่อเริ่มวิเคราะห์เรซูเม่และจับคู่ตำแหน่งฝึกงาน",
  },
};

// ===== Component 1: particle field background =====
// Same vanilla-canvas pattern used across the other redesigned demo pages —
// try/catch + its own effect so a canvas failure can't block the mode
// toggle or split-heading below.
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

// ===== Component 3: split-word heading, keyed by `mode` so it re-runs the
// stagger animation every time the toggle flips (not just on first load) =====
function SplitHeading({ text }: { text: string }) {
  const words = useMemo(() => text.split(" "), [text]);
  return (
    <h1 className={styles.heading}>
      {words.map((w, i) => (
        <span
          key={`${text}-${i}`}
          className={styles.splitWord}
          style={{ animationDelay: `${i * 0.06}s` }}
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </h1>
  );
}

function LoginRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useParticleCanvas(canvasRef);

  const initialMode: Mode = searchParams.get("mode") === "register" ? "register" : "login";
  const [mode, setModeState] = useState<Mode>(initialMode);

  // Keep the URL's ?mode= in sync so the toggle is bookmarkable/shareable,
  // same as visiting /login vs /register used to be — but without a full
  // navigation (no page reload, no losing form state on switch).
  function setMode(next: Mode) {
    if (next === mode) return;
    setModeState(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "login") params.delete("mode");
    else params.set("mode", next);
    const qs = params.toString();
    router.replace(qs ? `/login?${qs}` : "/login", { scroll: false });
  }

  const copy = COPY[mode];

  return (
    <div className={styles.page}>
      <canvas ref={canvasRef} className={styles.particleCanvas} aria-hidden="true" />
      <div className={styles.ambient} aria-hidden="true">
        <div className={`${styles.blob} ${styles.blobOne}`} />
        <div className={`${styles.blob} ${styles.blobTwo}`} />
      </div>

      <div className={styles.contentStack}>
        <div className={styles.backLinkRow}>
          <Link href="/" className={`${styles.backLink} ${styles.animateIn}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            กลับสู่หน้าหลัก
          </Link>
        </div>

        <div className={styles.eyebrow}>AI_PROJECT — เข้าสู่ระบบ</div>
        <SplitHeading text={copy.heading} />
        <p className={styles.subheading} style={{ marginTop: 8, textAlign: "center" }}>
          {copy.subheading}
        </p>

        {/* ===== Component 2: sliding pill mode toggle ===== */}
        <div className={styles.modeToggle} role="tablist" aria-label="สลับโหมดเข้าสู่ระบบ/สมัครสมาชิก">
          <div
            className={styles.modeIndicator}
            style={{ transform: mode === "register" ? "translateX(100%)" : "translateX(0)" }}
            aria-hidden="true"
          />
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={`${styles.modeBtn} ${mode === "login" ? styles.isActive : ""}`}
            onClick={() => setMode("login")}
          >
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            className={`${styles.modeBtn} ${mode === "register" ? styles.isActive : ""}`}
            onClick={() => setMode("register")}
          >
            สมัครสมาชิก
          </button>
        </div>

        {/* ===== Component 1: 3D card-flip between the two forms ===== */}
        <div className={styles.cardWrap}>
          <div className={styles.halo} aria-hidden="true" />
          <FlipStage mode={mode} setMode={setMode} />
        </div>
      </div>
    </div>
  );
}

function FlipStage({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  // .cardFaceBack is position:absolute (needed for the 3D flip), so it
  // never contributes to .cardStage's natural height on its own. Measure
  // both faces' real content height directly and size the stage to
  // whichever is taller (register's form is longer than login's) — same
  // fix as the standalone demo's measureCards().
  useEffect(() => {
    function measure() {
      const stage = stageRef.current;
      const front = frontRef.current;
      const back = backRef.current;
      if (!stage || !front || !back) return;
      stage.style.height = `${Math.max(front.offsetHeight, back.offsetHeight)}px`;
    }
    measure();
    window.addEventListener("resize", measure);
    // Re-measure shortly after mount too, in case web fonts shift line
    // heights after the first paint.
    const t = setTimeout(measure, 50);
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(t);
    };
  }, [mode]);

  return (
    <div ref={stageRef} className={styles.cardStage}>
      <div className={`${styles.cardFlip} ${mode === "register" ? styles.isFlipped : ""}`}>
        <div ref={frontRef} className={`${styles.cardFace} ${styles.cardFaceFront}`}>
          <div className={styles.card}>
            <div className={styles.brand}>
              <div className={`${styles.logoMark} ${styles.animateIn} ${styles.delay1}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 2 3 6.5V12c0 5.25 3.6 9.9 9 11 5.4-1.1 9-5.75 9-11V6.5L12 2Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.5 12.2 11 14.7l4.7-5.4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <LoginForm />

            <p className={`${styles.footer} ${styles.animateIn} ${styles.delay5}`}>
              ยังไม่มีบัญชี?{" "}
              <button
                type="button"
                className={styles.link}
                style={{ display: "inline", minHeight: "auto", padding: 0, background: "none", border: "none", cursor: "pointer" }}
                onClick={() => setMode("register")}
              >
                สมัครสมาชิก
              </button>
            </p>
          </div>
        </div>

        <div ref={backRef} className={`${styles.cardFace} ${styles.cardFaceBack}`}>
          <div className={styles.card}>
            <div className={styles.brand}>
              <div className={`${styles.logoMark} ${styles.animateIn} ${styles.delay1}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 2 3 6.5V12c0 5.25 3.6 9.9 9 11 5.4-1.1 9-5.75 9-11V6.5L12 2Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.5 12.2 11 14.7l4.7-5.4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <RegisterForm />

            <p className={`${styles.footer} ${styles.animateIn} ${styles.delay5}`}>
              มีบัญชีอยู่แล้ว?{" "}
              <button
                type="button"
                className={styles.link}
                style={{ display: "inline", minHeight: "auto", padding: 0, background: "none", border: "none", cursor: "pointer" }}
                onClick={() => setMode("login")}
              >
                เข้าสู่ระบบ
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// useSearchParams() (used inside LoginRegisterPage, for the ?mode= toggle)
// requires a Suspense boundary during prerendering/static export — without
// it, `next build` fails on this page with "useSearchParams() should be
// wrapped in a suspense boundary". The fallback below is invisible in
// practice: this route has no server-rendered content to bail out to (the
// whole page is "use client"), so the real content just pops in once
// React hydrates and resolves the search params, same as it always did.
function LoginPageFallback() {
  return <div className={styles.page} aria-hidden="true" />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginRegisterPage />
    </Suspense>
  );
}
