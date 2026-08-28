"use client";

// "ขั้นตอนการทำงาน" section — ported from the standalone demo
// (seam-demo/index.html #how-it-works) to sit directly below HomeHeroDemo.
//
// Now a client component (was a plain server component) to support 4
// React Bits-style additions requested for this section only — explicitly
// scoped to not touch HomeHeroDemo/HomeBlobLayer above it:
//   1. animation background — constellation/network canvas (drifting dots,
//      nearby ones joined by a fading line), local to this section only
//      (separate from HomeBlobLayer's shared blob background).
//   2. text animation — the "ขั้นตอนการทำงาน" heading splits into words,
//      blurs in once scrolled into view (IntersectionObserver-gated), then
//      settles into a continuously-looping gradient shimmer sweep.
//   3. component — the existing 3 cards gained a spotlight/glow-on-hover
//      effect (mouse-tracked radial gradient), no new cards/elements added.
//   4. animation — cards fade + slide up individually as they scroll into
//      view (IntersectionObserver again, one observer per card).
// Each addition is its own effect/handler wrapped in try/catch, same
// defensive pattern used elsewhere in Home, so one failing doesn't block
// the others.
//
// Note: Home ("/") is excluded from the shared AppShell/NavProvider (see
// components/layout/app-shell.tsx NO_NAV_ROUTES), so this section — and the
// footer below it — cannot use components/home/footer-section.tsx (it calls
// useNav(), which throws outside a NavProvider). A minimal self-contained
// footer is included at the bottom of this file instead.

import { useEffect, useRef, useState } from "react";

const CARDS = [
  {
    icon: "📄",
    title: "อัปโหลดเรซูเม่",
    desc: "อัปโหลดไฟล์เรซูเม่ของคุณ ระบบจะดึงข้อมูลทักษะโดยอัตโนมัติ",
    gradient:
      "linear-gradient(135deg, var(--color-home-hero-accent-1), var(--color-home-hero-accent-3))",
  },
  {
    icon: "🧠",
    title: "ประเมินทักษะ",
    desc: "AI วิเคราะห์และให้คะแนนทักษะของคุณตามความต้องการของตลาด",
    gradient:
      "linear-gradient(135deg, var(--color-home-hero-accent-2), var(--color-home-hero-accent-1))",
  },
  {
    icon: "🎯",
    title: "จับคู่ฝึกงาน",
    desc: "รับคำแนะนำสถานที่ฝึกงานที่เหมาะกับทักษะและความสนใจของคุณ",
    gradient:
      "linear-gradient(135deg, var(--color-home-hero-accent-3), var(--color-home-hero-accent-2))",
  },
];

// ===== Addition 1: constellation/network background (dots drifting slowly,
// nearby ones connected by a faint line — classic React Bits "Threads"/
// "Particles" network look), local to this section only (canvas sized to
// the section, not the viewport) =====
function useSectionParticles(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    let raf = 0;
    let resizeObserver: ResizeObserver | null = null;
    try {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const section = canvas?.parentElement;
      if (!canvas || !ctx || !section) return;

      const COLORS = ["#7c3aed", "#ec4899", "#3b82f6"];
      const LINK_DIST = 130; // px — dots closer than this get a connecting line
      type Dot = { x: number; y: number; r: number; vx: number; vy: number; color: string };
      let dots: Dot[] = [];

      function resize() {
        if (!canvas || !section) return;
        canvas.width = section.clientWidth;
        canvas.height = section.clientHeight;
        const area = canvas.width * canvas.height;
        const count = Math.min(55, Math.max(18, Math.round(area / 26000)));
        dots = Array.from({ length: count }, () => ({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: 1 + Math.random() * 1.6,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        }));
      }
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(section);
      resize();

      function frame() {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Drift each dot, bouncing softly off the section edges.
        dots.forEach((d) => {
          d.x += d.vx;
          d.y += d.vy;
          if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
          if (d.y < 0 || d.y > canvas.height) d.vy *= -1;
        });

        // Connect nearby dots — the "constellation" lines, opacity fades
        // out with distance so it never looks like a rigid grid.
        for (let i = 0; i < dots.length; i++) {
          for (let j = i + 1; j < dots.length; j++) {
            const a = dots[i];
            const b = dots[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < LINK_DIST) {
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = "#a78bfa";
              ctx.globalAlpha = (1 - dist / LINK_DIST) * 0.18;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
        ctx.globalAlpha = 1;

        // Dots on top of the lines.
        dots.forEach((d) => {
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fillStyle = d.color;
          ctx.globalAlpha = 0.4;
          ctx.fill();
          ctx.globalAlpha = 1;
        });

        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
    } catch (e) {
      console.error("Section particle init failed:", e);
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [canvasRef]);
}

// ===== Addition 2: split-word blur-in heading, gated by scroll — once the
// blur-in settles, a looping gradient (React Bits "GradientText"-style)
// sweeps across the whole heading continuously. =====
function SplitHeading({ text }: { text: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [visible, setVisible] = useState(false);
  const [shimmer, setShimmer] = useState(false);

  useEffect(() => {
    let shimmerTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      const el = ref.current;
      if (!el) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            setVisible(true);
            // Let the last word's blur-in transition finish (~0.5s + stagger)
            // before switching the heading over to the shimmer gradient, so
            // the two animations don't visually overlap/fight.
            shimmerTimer = setTimeout(() => setShimmer(true), 900);
            observer.disconnect();
          }
        },
        { threshold: 0.4 }
      );
      observer.observe(el);
      return () => {
        observer.disconnect();
        if (shimmerTimer) clearTimeout(shimmerTimer);
      };
    } catch (e) {
      console.error("Heading observer failed:", e);
      setVisible(true); // fail open — heading still shows even if the animation can't be gated
      setShimmer(true);
    }
  }, []);

  const words = text.split(" ");

  return (
    <>
      <h2
        ref={ref}
        className="mb-12 text-center text-[clamp(1.6rem,1.3rem+1.2vw,2.4rem)] font-bold text-white"
      >
        {words.map((w, i) => (
          <span
            key={i}
            className="inline-block"
            style={{
              opacity: visible ? 1 : 0,
              filter: visible ? "blur(0)" : "blur(6px)",
              transform: visible ? "translateY(0)" : "translateY(0.35em)",
              transition: `opacity 0.5s cubic-bezier(0.2,0.65,0.3,1) ${i * 0.08}s, filter 0.5s cubic-bezier(0.2,0.65,0.3,1) ${i * 0.08}s, transform 0.5s cubic-bezier(0.2,0.65,0.3,1) ${i * 0.08}s`,
              ...(shimmer
                ? {
                    backgroundImage:
                      "linear-gradient(90deg, #ffffff 0%, var(--color-home-hero-accent-1) 25%, var(--color-home-hero-accent-2) 50%, var(--color-home-hero-accent-3) 75%, #ffffff 100%)",
                    backgroundSize: "220% 100%",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    WebkitTextFillColor: "transparent",
                    animation: "how-it-works-shimmer 5s linear infinite",
                  }
                : {}),
            }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </h2>
      <style>{`
        @keyframes how-it-works-shimmer {
          0% { background-position: 220% 0; }
          100% { background-position: -220% 0; }
        }
      `}</style>
    </>
  );
}

// ===== Additions 3 + 4: spotlight-on-hover + scroll-reveal fade-up,
// applied per-card =====
function StepCard({ card, index }: { card: (typeof CARDS)[number]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [spot, setSpot] = useState({ x: 50, y: 50, active: false });

  useEffect(() => {
    try {
      const el = cardRef.current;
      if (!el) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
          }
        },
        { threshold: 0.2 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    } catch (e) {
      console.error("Card reveal observer failed:", e);
      setRevealed(true);
    }
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      setSpot({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
        active: true,
      });
    } catch (err) {
      console.error("Spotlight tracking failed:", err);
    }
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setSpot((s) => ({ ...s, active: false }))}
      className="group relative overflow-hidden rounded-[20px] border p-8 backdrop-blur-sm transition-transform duration-200 hover:-translate-y-1"
      style={{
        background: "rgba(255,255,255,0.04)",
        borderColor: "rgba(255,255,255,0.08)",
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease-out ${index * 0.12}s, transform 0.6s ease-out ${index * 0.12}s`,
      }}
    >
      {/* spotlight/glow layer — purely decorative, sits above the card
          background but below the content */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          opacity: spot.active ? 1 : 0,
          background: `radial-gradient(280px circle at ${spot.x}% ${spot.y}%, rgba(124,58,237,0.16), transparent 70%)`,
        }}
      />
      <div className="relative z-[1]">
        <div
          className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-xl"
          style={{ background: card.gradient }}
        >
          {card.icon}
        </div>
        <h3 className="mb-2 text-lg font-semibold text-white">{card.title}</h3>
        <p className="text-sm leading-relaxed text-white/60">{card.desc}</p>
      </div>
    </div>
  );
}

export function HowItWorksDemo() {
  // Solid black comes from HomeBlobLayer's own bg-black (mounted once in
  // app/page.tsx, position:fixed behind everything) — this component and
  // HomeHeroDemo both render transparent over it, same as the demo's
  // sections sitting transparently over a single <body> background. That's
  // also why this file doesn't set its own bg-black: an opaque background
  // here would paint over the shared blob layer and hide it, recreating the
  // seam. Decorative blobs live in HomeBlobLayer — see that file for why
  // per-component blobs (an earlier attempt) caused a visible seam. The new
  // particle canvas below is local to this section only (absolutely
  // positioned within it) and does not touch that shared layer.
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  useSectionParticles(particleCanvasRef);

  return (
    <div className="relative">
      <main className="relative z-[1] py-[clamp(4rem,8vw,7rem)]">
        <section id="how-it-works" className="relative mx-auto max-w-[1140px] px-6">
          <canvas
            ref={particleCanvasRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          />
          <SplitHeading text="ขั้นตอนการทำงาน" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CARDS.map((c, i) => (
              <StepCard key={c.title} card={c} index={i} />
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-[1] px-6 pb-10 pt-[clamp(3rem,6vw,4.5rem)] text-center">
        <p className="mx-auto max-w-[1140px] border-t border-white/10 pt-6 text-xs text-white/40">
          © 2026 AI_Project. สงวนลิขสิทธิ์.
        </p>
      </footer>
    </div>
  );
}
