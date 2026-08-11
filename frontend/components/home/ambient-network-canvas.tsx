"use client";

import dynamic from "next/dynamic";
import { useMountWhenVisible } from "./use-mount-when-visible";

const AmbientNetworkScene = dynamic(() => import("./ambient-network-scene"), { ssr: false });

/**
 * Lazy-loaded, section-scoped ambient background for HowItWorksCards.
 * Reuses the same useMountWhenVisible gating already shared by StepIcon and
 * BenefitIcon (desktop-only, mounts on scroll-into-view via
 * IntersectionObserver, unmounts on scroll-out, exposes reduced-motion) so
 * this doesn't duplicate a third mount-gating implementation. On mobile or
 * when unmounted, the section's own CSS gradient (see how-it-works.module.css
 * .ambientFallback) remains visible as the lightweight fallback.
 */
export function AmbientNetworkCanvas() {
  const { containerRef, shouldMount, reduceMotion } = useMountWhenVisible();

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {shouldMount && <AmbientNetworkScene staticFrame={reduceMotion} />}
    </div>
  );
}
