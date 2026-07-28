"use client";

import { useState } from "react";
import { ResumeUploadCard } from "./resume-upload-card";
import { StepIntroScreen } from "@/components/ui/step-intro-screen";
import styles from "./resume-upload.module.css";

/** Client wrapper: toggles between the intro/landing screen and the actual
 *  upload form. Kept separate from page.tsx so page.tsx can stay a server
 *  component and export metadata. */
export function UploadResumeFlow() {
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
          <ResumeUploadCard />
        ) : (
          <StepIntroScreen
            styles={styles}
            icon={
              <svg width="24" height="24" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                <path d="M224,152v56a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V152a8,8,0,0,1,16,0v56H208V152a8,8,0,0,1,16,0ZM93.66,85.66,120,59.31V152a8,8,0,0,0,16,0V59.31l26.34,26.35a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,93.66,85.66Z" />
              </svg>
            }
            heading="Upload your resume"
            subheading="We'll use AI to read your resume and pull out your skills automatically — this only takes a minute."
            points={[
              "Have your resume ready as a PDF, DOC, or DOCX file (max 5MB)",
              "We'll extract your skills automatically — no manual entry needed",
              "Optionally tell us the internship track you're interested in",
            ]}
            ctaLabel="Get started"
            onStart={() => setStarted(true)}
          />
        )}
      </div>
    </div>
  );
}
