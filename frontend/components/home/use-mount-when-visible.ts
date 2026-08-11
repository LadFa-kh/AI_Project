"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

const MOBILE_BREAKPOINT_PX = 768;

type UseMountWhenVisibleResult = {
  /** Attach to the element that should gate mounting (e.g. the icon container). */
  containerRef: RefObject<HTMLDivElement | null>;
  /** True once viewport is >=768px, the element has scrolled into view, and it's still in view. */
  shouldMount: boolean;
  /** True if the user has requested reduced motion — callers should render a static frame/fallback. */
  reduceMotion: boolean;
};

/**
 * Shared gating logic for lightweight embedded R3F icon canvases (used by
 * HowItWorksCards' StepIcon and BenefitsSection's BenefitIcon). Encapsulates:
 *  - desktop-only (>=768px) check, so mobile never mounts WebGL
 *  - prefers-reduced-motion detection, so callers can render a static frame
 *  - IntersectionObserver-driven mount/unmount, so off-screen canvases don't
 *    keep rendering (mounts on enter, unmounts on exit — not "animate once")
 *
 * Callers are responsible for rendering their own fallback (numbered badge,
 * static SVG, etc.) when `shouldMount` is false.
 */
export function useMountWhenVisible(): UseMountWhenVisibleResult {
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

  return {
    containerRef,
    shouldMount: isDesktop && inView,
    reduceMotion,
  };
}
