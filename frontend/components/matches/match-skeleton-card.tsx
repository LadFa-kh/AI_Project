import styles from "./matches-list.module.css";

export function MatchSkeletonCard() {
  return (
    <div className={styles.skeletonCard} aria-hidden="true">
      <div className={styles.skeletonLine} style={{ width: "70%" }} />
      <div className={styles.skeletonLine} style={{ width: "45%" }} />
      <div className={styles.skeletonLine} style={{ width: "90%", marginTop: 8 }} />
      <div className={styles.skeletonLine} style={{ width: "44px", height: "36px", borderRadius: 8, marginTop: 4 }} />
    </div>
  );
}
