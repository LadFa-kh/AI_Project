"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  /** Stagger delay in ms, applied only while animating in (ignored once revealed/instant). */
  delayMs?: number;
  className?: string;
};

/**
 * Fades + slides content up (16px) the first time it scrolls into view.
 * Uses IntersectionObserver (no library). Respects prefers-reduced-motion —
 * content shows immediately, no animation, if the user has that setting on.
 * Animates once only: after the first reveal, the observer is disconnected.
 */
export function ScrollReveal({ children, delayMs = 0, className }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mediaQuery.matches);

    if (mediaQuery.matches) {
      setIsVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={
        reduceMotion
          ? undefined
          : {
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(20px)",
              transition: `opacity 350ms ease-out ${delayMs}ms, transform 350ms ease-out ${delayMs}ms`,
              willChange: "opacity, transform",
            }
      }
    >
      {children}
    </div>
  );
}
