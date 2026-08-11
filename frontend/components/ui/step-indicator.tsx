import styles from "./nocturne.module.css";

type StepIndicatorProps = {
  currentStep: number;
  totalSteps: number;
  label: string;
};

/** Shared "Step X of N — Label" pattern for the Nocturne visual system.
 *  Reuse this on any multi-step screen (upload -> assessment -> results). */
export function StepIndicator({ currentStep, totalSteps, label }: StepIndicatorProps) {
  return (
    <div className={styles.steps}>
      <span className={styles.stepLabel}>
        Step {currentStep} of {totalSteps} — {label}
      </span>
      <div className={styles.stepTrack} role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <span
            key={i}
            className={`${styles.stepDot} ${i < currentStep ? styles.stepDotActive : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
