import { useEffect, useState } from "react";
import styles from "./matches-list.module.css";

export type MatchFilterMode = "matching" | "all";

type MatchesControlBarProps = {
  filterMode: MatchFilterMode;
  onFilterModeChange: (mode: MatchFilterMode) => void;
  skillOptions: string[];
  // Multiple skills can be selected at once — jobs must have ALL selected
  // skills to match (AND), not just any one of them.
  activeSkills: string[];
  onSkillToggle: (skill: string) => void;
  onClearSkills: () => void;
  /** false = hide the "ตรงกับคุณ / ทั้งหมด" select (browse-only / no personal matching). */
  showModeSelect?: boolean;
};

// "ทั้งหมด" (all workplaces) can surface dozens of distinct required skills
// across every listing, which floods this row — cap what's shown by default
// and let the user expand it, rather than always rendering every chip.
const COLLAPSED_SKILL_LIMIT = 12;

export function MatchesControlBar({
  filterMode,
  onFilterModeChange,
  skillOptions,
  activeSkills,
  onSkillToggle,
  onClearSkills,
  showModeSelect = true,
}: MatchesControlBarProps) {
  const [expanded, setExpanded] = useState(false);

  // Collapse back down whenever the underlying skill list changes (e.g.
  // switching filterMode) so a stale "expanded" state from one mode doesn't
  // carry over and look inconsistent in the other.
  useEffect(() => {
    setExpanded(false);
  }, [skillOptions]);

  const isTruncated = skillOptions.length > COLLAPSED_SKILL_LIMIT;
  const visibleSkills = expanded ? skillOptions : skillOptions.slice(0, COLLAPSED_SKILL_LIMIT);

  return (
    <div className={styles.controlBar}>
      {showModeSelect && (
        <>
          <label htmlFor="match-filter-mode" className="sr-only">
            กรองตำแหน่งที่แนะนำ
          </label>
          <select
            id="match-filter-mode"
            value={filterMode}
            onChange={(e) => onFilterModeChange(e.target.value as MatchFilterMode)}
            className={styles.sortSelect}
          >
            <option value="matching">ตรงกับคุณ</option>
            <option value="all">ทั้งหมด</option>
          </select>
        </>
      )}

      <div className={styles.filterChips} role="group" aria-label="กรองตามทักษะที่ต้องการ (เลือกได้หลายทักษะ)">
        <button
          type="button"
          onClick={onClearSkills}
          aria-pressed={activeSkills.length === 0}
          className={`${styles.filterChip} ${activeSkills.length === 0 ? styles.filterChipActive : ""}`}
        >
          ทุกทักษะ
        </button>
        {visibleSkills.map((skill) => {
          const isActive = activeSkills.includes(skill);
          return (
            <button
              key={skill}
              type="button"
              onClick={() => onSkillToggle(skill)}
              aria-pressed={isActive}
              className={`${styles.filterChip} ${isActive ? styles.filterChipActive : ""}`}
            >
              {skill}
            </button>
          );
        })}
        {isTruncated && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className={styles.filterChipToggle}
          >
            {expanded ? "แสดงน้อยลง" : `ดูเพิ่มเติม (+${skillOptions.length - COLLAPSED_SKILL_LIMIT})`}
          </button>
        )}
      </div>
    </div>
  );
}
