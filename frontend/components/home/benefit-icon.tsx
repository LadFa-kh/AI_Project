"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { BenefitIconKind } from "./benefit-icon-scene";
import { useMountWhenVisible } from "./use-mount-when-visible";
import styles from "./benefits-section.module.css";

const BenefitIconScene = dynamic(() => import("./benefit-icon-scene"), { ssr: false });

// Matches ScrollReveal's entrance transition duration + this card's stagger
// delay budget, so the 3D loop doesn't start animating mid-entrance.
const ENTRANCE_ANIMATION_MS = 500;

type BenefitIconProps = {
  kind: BenefitIconKind;
  hovered?: boolean;
  /** Extra delay (ms) before the loop is allowed to start, e.g. this card's stagger delay. */
  entranceDelayMs?: number;
};

function StaticIconGlyph({ kind }: { kind: BenefitIconKind }) {
  // Simple static SVG equivalents, shown on mobile / reduced-motion / before
  // the 3D canvas is allowed to mount.
  if (kind === "extract") {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden="true">
        <rect x="6" y="3" width="12" height="16" rx="1.5" stroke="#FC8337" strokeWidth="1.5" />
        <circle cx="19" cy="7" r="1.3" fill="#FC8337" />
        <circle cx="20" cy="12" r="1" fill="#FC8337" opacity="0.6" />
      </svg>
    );
  }
  if (kind === "select") {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8" stroke="#FC8337" strokeWidth="1.5" />
        <path d="M8 12l2.5 2.5L16 9" stroke="#FC8337" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden="true">
      <rect x="3" y="9" width="7" height="7" rx="1" fill="#FC8337" />
      <rect x="14" y="9" width="7" height="7" rx="1" transform="rotate(45 17.5 12.5)" fill="#8A8A94" />
    </svg>
  );
}

/**
 * Small embedded R3F canvas representing a benefit's value proposition.
 * Mirrors StepIcon's mount-gating rules via the shared useMountWhenVisible
 * hook, and additionally waits for the card's scroll-entrance animation to
 * finish before starting the loop, so the icon doesn't animate mid-reveal.
 */
export function BenefitIcon({ kind, hovered = false, entranceDelayMs = 0 }: BenefitIconProps) {
  const { containerRef, shouldMount, reduceMotion } = useMountWhenVisible();
  const [entranceDone, setEntranceDone] = useState(false);

  useEffect(() => {
    if (!shouldMount) return;
    const timer = setTimeout(() => setEntranceDone(true), ENTRANCE_ANIMATION_MS + entranceDelayMs);
    return () => clearTimeout(timer);
  }, [shouldMount, entranceDelayMs]);

  const showCanvas = shouldMount && entranceDone;

  return (
    <div ref={containerRef} className={styles.iconBadge}>
      {showCanvas ? (
        <BenefitIconScene kind={kind} staticFrame={reduceMotion} hovered={hovered} />
      ) : (
        <StaticIconGlyph kind={kind} />
      )}
    </div>
  );
}
