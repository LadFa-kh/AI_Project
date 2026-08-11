import styles from "./nocturne.module.css";

type InsightChipListProps = {
  heading: string;
  items: string[];
  tone: "positive" | "warning";
};

const ICONS: Record<InsightChipListProps["tone"], { path: string; label: string }> = {
  positive: {
    label: "Strength",
    path: "M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z",
  },
  warning: {
    label: "Area to grow",
    path: "M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V72a8,8,0,0,1,16,0v64a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z",
  },
};

/** Positive/warning-tinted chip list, shared for strengths & gaps-style sections.
 *  Tone is conveyed by both color and icon+label (not color alone) for accessibility. */
export function InsightChipList({ heading, items, tone }: InsightChipListProps) {
  const icon = ICONS[tone];
  const chipClass = tone === "positive" ? styles.chipPositive : styles.chipWarning;

  return (
    <div>
      <h2 className={styles.sectionHeading}>{heading}</h2>
      <div className={styles.chipList}>
        {items.map((item) => (
          <div key={item} className={`${styles.chip} ${chipClass}`}>
            <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
              <path d={icon.path} />
            </svg>
            <span>
              <span className="sr-only">{icon.label}: </span>
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
