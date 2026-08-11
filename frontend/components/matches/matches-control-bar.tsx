import { MATCH_SORT_OPTIONS, type MatchSortOption } from "@/lib/internship-match-types";
import styles from "./matches-list.module.css";

type MatchesControlBarProps = {
  sort: MatchSortOption;
  onSortChange: (value: MatchSortOption) => void;
  skillOptions: string[];
  activeSkill: string | null;
  onSkillChange: (skill: string | null) => void;
};

export function MatchesControlBar({
  sort,
  onSortChange,
  skillOptions,
  activeSkill,
  onSkillChange,
}: MatchesControlBarProps) {
  return (
    <div className={styles.controlBar}>
      <label htmlFor="match-sort" className="sr-only">
        Sort matches
      </label>
      <select
        id="match-sort"
        value={sort}
        onChange={(e) => onSortChange(e.target.value as MatchSortOption)}
        className={styles.sortSelect}
      >
        {MATCH_SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className={styles.filterChips} role="group" aria-label="Filter by required skill">
        <button
          type="button"
          onClick={() => onSkillChange(null)}
          aria-pressed={activeSkill === null}
          className={`${styles.filterChip} ${activeSkill === null ? styles.filterChipActive : ""}`}
        >
          All skills
        </button>
        {skillOptions.map((skill) => (
          <button
            key={skill}
            type="button"
            onClick={() => onSkillChange(skill)}
            aria-pressed={activeSkill === skill}
            className={`${styles.filterChip} ${activeSkill === skill ? styles.filterChipActive : ""}`}
          >
            {skill}
          </button>
        ))}
      </div>
    </div>
  );
}
