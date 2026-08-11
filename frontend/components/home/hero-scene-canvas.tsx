"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false });

const MOBILE_BREAKPOINT_PX = 768;

/**
 * Gates the 3D hero scene behind viewport width and prefers-reduced-motion
 * checks, and lazy-loads the actual Three.js scene (ssr:false) so the
 * three.js/R3F bundle never blocks initial page load or SSR. Renders
 * nothing on mobile (<768px) or when reduced motion is requested — the
 * existing CSS gradient layer in HomeHero remains visible as the fallback
 * background in both cases.
 */
export function HeroSceneCanvas() {
  const [shouldRender, setShouldRender] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const widthQuery = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT_PX}px)`);

    const evaluate = () => {
      setReduceMotion(motionQuery.matches);
      setShouldRender(widthQuery.matches);
    };

    evaluate();

    motionQuery.addEventListener("change", evaluate);
    widthQuery.addEventListener("change", evaluate);
    return () => {
      motionQuery.removeEventListener("change", evaluate);
      widthQuery.removeEventListener("change", evaluate);
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <HeroScene staticFrame={reduceMotion} />
    </div>
  );
}
