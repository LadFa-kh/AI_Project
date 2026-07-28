"use client";

import { useState } from "react";
import { SkillAssessmentCard } from "./skill-assessment-card";
import { StepIntroScreen } from "@/components/ui/step-intro-screen";
import styles from "./skill-assessment.module.css";

/** Client wrapper: toggles between the intro/landing screen and the actual
 *  assessment form. Kept separate from page.tsx so page.tsx can stay a
 *  server component and export metadata. */
export function SkillAssessmentFlow() {
  const [started, setStarted] = useState(false);

  return (
    <div className={styles.page}>
      <div className={styles.ambient} aria-hidden="true">
        <div className={`${styles.blob} ${styles.blobOne}`} />
        <div className={`${styles.blob} ${styles.blobTwo}`} />
      </div>

      <div className={styles.cardWrap}>
        <div className={styles.halo} aria-hidden="true" />
        {started ? (
          <SkillAssessmentCard />
        ) : (
          <StepIntroScreen
            styles={styles}
            icon={
              <svg width="24" height="24" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                <path d="M226.76,69.66l-48-32a8,8,0,0,0-8.72,0L128,63.87,85.96,37.66a8,8,0,0,0-8.72,0l-48,32A8,8,0,0,0,26,76.14l6,3.75V176a8,8,0,0,0,3.58,6.66l88,58.67a8,8,0,0,0,8.84,0l88-58.67A8,8,0,0,0,224,176V79.89l6-3.75a8,8,0,0,0-3.24-14.48ZM128,79.6,159.71,88,128,108.13,96.29,88ZM120,224.4,48,176.7V89.51l72,45ZM128,120.13,196,76.66l17.16,11.4L128,142.13,42.84,88.06,60,76.66Zm8,104.27V134.51l72-45v87.19Z" />
              </svg>
            }
            heading="Rate your skills"
            subheading="A few quick questions based on the skills we found in your resume — be honest, this helps us match you better."
            points={[
              "Answer for each skill we detected from your resume",
              "Pick the level that honestly reflects your ability",
              "Takes about 2 minutes — you can review before submitting",
            ]}
            ctaLabel="Start assessment"
            onStart={() => setStarted(true)}
          />
        )}
      </div>
    </div>
  );
}
