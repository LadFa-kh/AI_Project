"use client";

// Small 3-step progress indicator for the resume → assessment → result
// flow, shown in the sidebar/drawer between the nav items and the auth
// footer. Highlights the step matching the current route; earlier steps
// are marked done once the user has moved past them.

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/components/ui/nocturne.module.css";

const STEPS = [
  { href: "/upload-resume", label: "Upload" },
  { href: "/skill-assessment", label: "Assessment" },
  { href: "/evaluation-result", label: "Result" },
];

export function ProcessStepper() {
  const pathname = usePathname();
  const currentIndex = STEPS.findIndex((step) => pathname.startsWith(step.href));

  // Not on any of the three flow pages (e.g. "/" or "/internship-matches") —
  // nothing meaningful to highlight, so don't show the stepper.
  if (currentIndex === -1) return null;

  return (
    <div className={styles.processStepper} aria-label="Resume assessment progress">
      {STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <Link
            key={step.href}
            href={step.href}
            className={`${styles.processStep} ${isCurrent ? styles.processStepCurrent : ""} ${isDone ? styles.processStepDone : ""}`}
            aria-current={isCurrent ? "step" : undefined}
          >
            <span className={styles.processStepDot} aria-hidden="true">
              {isDone ? (
                <svg width="10" height="10" viewBox="0 0 256 256" fill="currentColor">
                  <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
                </svg>
              ) : (
                index + 1
              )}
            </span>
            <span className={styles.processStepLabel}>{step.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
