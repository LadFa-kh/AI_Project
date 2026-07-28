import type { ReactNode } from "react";

type StepIntroScreenProps = {
  /** CSS module classes from the host page's own module (e.g. resume-upload.module.css,
   *  skill-assessment.module.css). Kept generic so this component has no CSS module of
   *  its own and stays scoped to each host page's already-approved visual language. */
  styles: {
    card: string;
    headingBlock: string;
    heading: string;
    subheading: string;
    submitBtn: string;
    animateIn: string;
    delay1: string;
    delay2: string;
    delay3: string;
    delay4: string;
    introIconWrap: string;
    introList: string;
    introListItem: string;
  };
  icon: ReactNode;
  heading: string;
  subheading: string;
  /** Short "what to expect / what you'll need" bullets. */
  points: string[];
  ctaLabel: string;
  onStart: () => void;
};

/**
 * Shared intro/landing screen shown before a multi-step flow's actual form
 * (upload-resume, skill-assessment). Renders inside the same glassmorphism
 * .card shell the host page already uses, so no new visual system is
 * introduced — just an additional screen state before the form mounts.
 */
export function StepIntroScreen({
  styles,
  icon,
  heading,
  subheading,
  points,
  ctaLabel,
  onStart,
}: StepIntroScreenProps) {
  return (
    <div className={styles.card}>
      <div className={`${styles.introIconWrap} ${styles.animateIn} ${styles.delay1}`} aria-hidden="true">
        {icon}
      </div>

      <div className={`${styles.headingBlock} ${styles.animateIn} ${styles.delay2}`}>
        <h1 className={styles.heading}>{heading}</h1>
        <p className={styles.subheading}>{subheading}</p>
      </div>

      <ul className={`${styles.introList} ${styles.animateIn} ${styles.delay3}`}>
        {points.map((point) => (
          <li key={point} className={styles.introListItem}>
            <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
              <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
            </svg>
            {point}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onStart}
        className={`${styles.submitBtn} ${styles.animateIn} ${styles.delay4}`}
      >
        {ctaLabel}
      </button>
    </div>
  );
}
