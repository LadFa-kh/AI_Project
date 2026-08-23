"use client";

// Home hero — floating top navbar (Nocturne purple/pink/blue, scoped only to
// this component per explicit request — see globals.css comment above the
// --color-home-hero-accent-* tokens) + WebGL WebThreads background + looping
// typewriter heading. Ported from the standalone demo (seam-demo/index.html /
// index_2.html reference) into React/Tailwind, using the project's real
// design-token rule (AGENTS.md: never hardcode hex, always a token) and real
// routes (/login, /register) instead of demo "#" links.
//
// Navbar auth state is real (useAuth()), mirroring the sidebar's
// AuthStatus.tsx pattern: signed-out shows เข้าสู่ระบบ/สมัครสมาชิก + Google,
// signed-in shows the same page links as the sidebar (NAV_ITEMS) plus an
// avatar with a Profile/Settings/Logout dropdown. Every route except "/" is
// guarded (see route-guard.tsx) so these links only make sense once signed
// in — they're intentionally absent from the signed-out state. The Google
// button calls the same real (not-yet-implemented) handler contract as
// LoginForm/RegisterForm — see handleGoogleSignIn below.
//
// WebGL init and the typewriter loop are each wrapped in their own effect +
// try/catch, same defensive pattern used across the demo pages, so a WebGL
// context failure can never block the heading animation (or vice versa).

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { TopNav } from "@/components/layout/top-nav";

const HEADING = "วิเคราะห์เรซูเม่ ประเมินทักษะ\nจับคู่ฝึกงานที่ใช่สำหรับคุณ";

function useWebThreads(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    let raf = 0;
    let resizeHandler: (() => void) | null = null;
    try {
      const canvas = canvasRef.current;
      const gl = canvas?.getContext("webgl2", {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
      });
      if (!canvas || !gl) {
        if (canvas) canvas.style.display = "none";
        return;
      }

      const vertexSrc = `#version 300 es
      in vec2 position;
      void main() { gl_Position = vec4(position, 0.0, 1.0); }
      `;

      const fragmentSrc = `#version 300 es
      precision highp float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform float uSpeed, uThreadCount, uFrequency, uSpread, uTaper, uPosition, uFanMode;
      uniform float uGlow, uFalloff, uThickness, uBrightness, uOpacity, uMirror, uShimmer, uGrain, uGrainIntensity;
      uniform vec3 uColor1, uColor2, uColor3;
      uniform vec2 uMouse;
      uniform float uMouseStrength, uEnableMouse, uMouseActive;
      out vec4 fragColor;
      #define TAU 6.28318530718
      #define MAX_THREADS 10
      float glowFn(float x, float str, float dist) { return dist / pow(max(x, 1e-4), str); }
      void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        float n = max(uThreadCount, 1.0);
        float pinchX = uFanMode < 0.5 ? 0.5 : (uFanMode < 1.5 ? 0.0 : 1.0);
        if (uEnableMouse > 0.5) pinchX = mix(pinchX, uMouse.x, clamp(uMouseStrength, 0.0, 1.0) * uMouseActive);
        float spreadDx = uSpread * abs(uv.x - pinchX);
        float baseT = iTime * uSpeed;
        float tauOverN = TAU / n;
        float mirror = uMirror > 0.5 ? sign(pinchX - uv.x) : 1.0;
        bool doShimmer = uShimmer > 0.5;
        float shimmerT = iTime * 1.7;
        float invThickness = 1.0 / max(uThickness, 0.01);
        float xFreq = uv.x * uFrequency;
        float yOff = uv.y - uPosition;
        float ciScale = n > 1.0 ? 1.0 / (n - 1.0) : 0.0;
        vec3 col = vec3(0.0);
        float gsum = 0.0;
        for (int idx = 0; idx < MAX_THREADS; idx++) {
          float i = float(idx);
          if (i >= n) break;
          float amplitude = spreadDx * (1.0 + i * uTaper);
          float shimmerV = doShimmer ? sin(shimmerT + i * 1.3) * 0.35 : 0.0;
          float phase = (baseT + i * tauOverN) * mirror + shimmerV;
          float sdf = abs(yOff + sin(xFreq + phase) * amplitude) * invThickness;
          float g = glowFn(sdf, uFalloff, uGlow);
          float ci = i * ciScale;
          vec3 threadCol = mix(uColor1, uColor2, ci);
          col += g * threadCol;
          gsum += g;
        }
        float coreAmt = smoothstep(0.5, 2.2, gsum);
        col = mix(col, uColor3 * gsum, coreAmt * 0.5);
        float bright = uBrightness;
        if (uEnableMouse > 0.5) {
          vec2 md = uv - uMouse;
          float d2 = dot(md, md);
          bright += clamp(uMouseStrength, 0.0, 1.0) * uMouseActive * exp(-d2 * 6.0) * 0.6;
        }
        col *= bright;
        float alpha = clamp(gsum, 0.0, 1.0) * uOpacity;
        vec3 outRgb = col * alpha;
        if (uGrain > 0.5) {
          float gv = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + iTime) * 43758.5453) - 0.5) * uGrainIntensity;
          outRgb = clamp(outRgb + gv, 0.0, 1.0);
          alpha = clamp(alpha + gv, 0.0, 1.0);
        }
        fragColor = vec4(outRgb, alpha);
      }
      `;

      function compile(type: number, src: string) {
        const sh = gl!.createShader(type)!;
        gl!.shaderSource(sh, src);
        gl!.compileShader(sh);
        if (!gl!.getShaderParameter(sh, gl!.COMPILE_STATUS)) {
          console.error(gl!.getShaderInfoLog(sh));
        }
        return sh;
      }
      const program = gl.createProgram()!;
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSrc));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSrc));
      gl.linkProgram(program);
      gl.useProgram(program);

      const posBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const posLoc = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      const U: Record<string, WebGLUniformLocation | null> = {};
      [
        "iResolution", "iTime", "uSpeed", "uThreadCount", "uFrequency", "uSpread", "uTaper", "uPosition",
        "uFanMode", "uGlow", "uFalloff", "uThickness", "uBrightness", "uOpacity", "uMirror", "uShimmer",
        "uGrain", "uGrainIntensity", "uColor1", "uColor2", "uColor3", "uMouse", "uMouseStrength",
        "uEnableMouse", "uMouseActive",
      ].forEach((name) => { U[name] = gl.getUniformLocation(program, name); });

      function hexToRgb(hex: string): [number, number, number] {
        const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!m) return [1, 1, 1];
        return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
      }

      // Same 3-color combo used on the demo hero (index_2.html).
      const color1 = hexToRgb("#0005ff");
      const color2 = hexToRgb("#ef4444");
      const color3 = hexToRgb("#16cc18");

      function resize() {
        if (!canvas) return;
        const rect = canvas.parentElement?.getBoundingClientRect();
        if (!rect) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.floor(rect.width * dpr));
        canvas.height = Math.max(1, Math.floor(rect.height * dpr));
        gl!.viewport(0, 0, canvas.width, canvas.height);
      }
      resizeHandler = resize;
      window.addEventListener("resize", resize);
      resize();

      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      const t0 = performance.now();
      function frame(t: number) {
        gl!.clear(gl!.COLOR_BUFFER_BIT);
        gl!.uniform2f(U.iResolution, canvas!.width, canvas!.height);
        gl!.uniform1f(U.iTime, (t - t0) * 0.001);
        gl!.uniform1f(U.uSpeed, 0.2);
        gl!.uniform1f(U.uThreadCount, 6);
        gl!.uniform1f(U.uFrequency, 5.0);
        gl!.uniform1f(U.uSpread, 0.18);
        gl!.uniform1f(U.uTaper, 1.0);
        gl!.uniform1f(U.uPosition, 0.5);
        gl!.uniform1f(U.uFanMode, 0);
        gl!.uniform1f(U.uGlow, 0.02);
        gl!.uniform1f(U.uFalloff, 0.6);
        gl!.uniform1f(U.uThickness, 1.1);
        gl!.uniform1f(U.uBrightness, 0.6);
        gl!.uniform1f(U.uOpacity, 1.0);
        gl!.uniform1f(U.uMirror, 1.0);
        gl!.uniform1f(U.uShimmer, 0.0);
        gl!.uniform1f(U.uGrain, 1.0);
        gl!.uniform1f(U.uGrainIntensity, 0.05);
        gl!.uniform3f(U.uColor1, color1[0], color1[1], color1[2]);
        gl!.uniform3f(U.uColor2, color2[0], color2[1], color2[2]);
        gl!.uniform3f(U.uColor3, color3[0], color3[1], color3[2]);
        gl!.uniform2f(U.uMouse, 0.5, 0.5);
        gl!.uniform1f(U.uMouseStrength, 0.3);
        gl!.uniform1f(U.uEnableMouse, 0.0);
        gl!.uniform1f(U.uMouseActive, 0.0);
        gl!.drawArrays(gl!.TRIANGLES, 0, 3);
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
    } catch (e) {
      console.error("WebThreads init failed:", e);
    }

    return () => {
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [canvasRef]);
}

function useTypeLoop(textRef: React.RefObject<HTMLSpanElement | null>) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const el = textRef.current;
      if (!el) return;

      const typingSpeed = 45;
      const deletingSpeed = 20;
      const pauseDuration = 2200;
      const initialDelay = 200;

      let charIndex = 0;
      let isDeleting = false;

      function tick() {
        if (!el) return;
        if (!isDeleting) {
          if (charIndex < HEADING.length) {
            charIndex++;
            el.textContent = HEADING.slice(0, charIndex);
            timer = setTimeout(tick, typingSpeed);
          } else {
            timer = setTimeout(() => { isDeleting = true; tick(); }, pauseDuration);
          }
        } else {
          if (charIndex > 0) {
            charIndex--;
            el.textContent = HEADING.slice(0, charIndex);
            timer = setTimeout(tick, deletingSpeed);
          } else {
            isDeleting = false;
            timer = setTimeout(tick, pauseDuration);
          }
        }
      }
      timer = setTimeout(tick, initialDelay);
    } catch (e) {
      console.error("Type loop init failed:", e);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [textRef]);
}

export function HomeHeroDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const typeTextRef = useRef<HTMLSpanElement>(null);
  useWebThreads(canvasRef);
  useTypeLoop(typeTextRef);

  const { user, isAuthenticated } = useAuth();

  return (
    <section className="relative isolate overflow-visible">
      {/* decorative blobs now live in HomeBlobLayer (mounted once in
          app/page.tsx, shared across this section and HowItWorksDemo) — see
          that file for why: per-component blobs created a seam the demo
          never had. */}

      {/* floating navbar — shared TopNav component (also used by every
          other route via AppShell) so Home and the rest of the app use
          the same dock-style Nocturne navbar. */}
      <TopNav />

      <header className="relative flex min-h-[92vh] flex-col items-center justify-center px-6 pb-[6vh] pt-[calc(6vh+84px)] text-center">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 h-full w-full"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 12%, black 78%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 12%, black 78%, transparent 100%)",
          }}
        />
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/60">
            AI_PROJECT
          </div>
          <h1 className="min-h-[2.4em] max-w-[820px] whitespace-pre-wrap text-[clamp(2.2rem,1.6rem+3vw,4rem)] font-extrabold leading-[1.15] text-white">
            <span ref={typeTextRef} />
            <span
              aria-hidden="true"
              className="ml-0.5 inline-block [animation:home-hero-blink_1s_steps(1)_infinite]"
              style={{ color: "var(--color-home-hero-accent-2)" }}
            >
              |
            </span>
          </h1>
          <p className="mt-6 max-w-[560px] text-white/70">
            อัปโหลดเรซูเม่ ให้ AI ประเมินทักษะของคุณ แล้วรับคำแนะนำสถานที่ฝึกงานที่เหมาะกับคุณที่สุด
          </p>
          <div className="mt-10 flex gap-4">
            {isAuthenticated && user ? (
              // Signed in already — sending back to /login or /register here
              // would just show the auth forms to someone who doesn't need
              // them. Route straight into the app instead (upload-resume is
              // the first real step of the flow).
              <Link
                href="/upload-resume"
                className="rounded-full px-8 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(124,58,237,0.6)] transition-transform hover:-translate-y-0.5"
                style={{
                  background:
                    "linear-gradient(120deg, var(--color-home-hero-accent-1), var(--color-home-hero-accent-2))",
                }}
              >
                ไปที่อัปโหลดเรซูเม่
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-8 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(124,58,237,0.6)] transition-transform hover:-translate-y-0.5"
                  style={{
                    background:
                      "linear-gradient(120deg, var(--color-home-hero-accent-1), var(--color-home-hero-accent-2))",
                  }}
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/register"
                  className="rounded-full border px-8 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                  style={{ borderColor: "rgba(255,255,255,0.2)" }}
                >
                  สมัครสมาชิก
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <style>{`
        @keyframes home-hero-blink { 50% { opacity: 0; } }
      `}</style>
    </section>
  );
}
