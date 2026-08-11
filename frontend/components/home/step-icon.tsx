"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { StepIconKind } from "./step-icon-scene";
import styles from "./how-it-works.module.css";

const StepIconScene = dynamic(() => import("./step-icon-scene"), { ssr: false });

const MOBILE_BREAKPOINT_PX = 768;

type StepIconProps = {
  kind: StepIconKind;
  /** Plain numbered badge fallback content (e.g. "1"), shown on mobile or when 3D is skipped. */
  number: string;
  hovered?: boolean;
};

/**
 * Small embedded R3F canvas standing in for a step's numbered badge. Only
 * mounts the Canvas once this icon has scrolled into view (own
 * IntersectionObserver, independent of the card's ScrollReveal wrapper), and
 * only on viewports >=768px with no prefers-reduced-motion. Everywhere else
 * it renders the original numbered circle so mobile never pays for WebGL.
 */
export function StepIcon({ kind, number, hovered = false }: StepIconProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const widthQuery = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT_PX}px)`);

    const evaluate = () => {
      setReduceMotion(motionQuery.matches);
      setIsDesktop(widthQuery.matches);
    };

    evaluate();
    motionQuery.addEventListener("change", evaluate);
    widthQuery.addEventListener("change", evaluate);
    return () => {
      motionQuery.removeEventListener("change", evaluate);
      widthQuery.removeEventListener("change", evaluate);
    };
  }, []);

  useEffect(() => {
    if (!isDesktop) return;
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setInView(entry.isIntersecting));
      },
      { threshold: 0.2 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isDesktop]);

  const showCanvas = isDesktop && inView;

  return (
    <div ref={containerRef} className={styles.numberBadge}>
      {showCanvas ? (
        <StepIconScene kind={kind} staticFrame={reduceMotion} hovered={hovered} />
      ) : (
        <span>{number}</span>
      )}
    </div>
  );
}
