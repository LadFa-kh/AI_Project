"use client";

import type { KeyboardEvent } from "react";
import { SKILL_LEVELS, type SkillLevel } from "@/lib/assessment-types";
import styles from "./skill-assessment.module.css";

type SkillLevelGroupProps = {
  skillName: string;
  selected: SkillLevel | null;
  disabled?: boolean;
  onSelect: (level: SkillLevel) => void;
};

export function SkillLevelGroup({ skillName, selected, disabled, onSelect }: SkillLevelGroupProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>, index: number) {
    if (disabled) return;
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      nextIndex = (index + 1) % SKILL_LEVELS.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      nextIndex = (index - 1 + SKILL_LEVELS.length) % SKILL_LEVELS.length;
    }
    if (nextIndex !== null) {
      e.preventDefault();
      onSelect(SKILL_LEVELS[nextIndex].value);
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={`Skill level for ${skillName}`}
      className={styles.levelGroup}
    >
      {SKILL_LEVELS.map((level, index) => {
        const isSelected = selected === level.value;
        return (
          <div
            key={level.value}
            role="radio"
            aria-checked={isSelected}
            aria-label={`${skillName}: ${level.label}`}
            tabIndex={disabled ? -1 : isSelected || (!selected && index === 0) ? 0 : -1}
            onClick={() => !disabled && onSelect(level.value)}
            onKeyDown={(e) => {
              handleKeyDown(e, index);
              if (!disabled && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onSelect(level.value);
              }
            }}
            className={`${styles.levelOption} ${isSelected ? styles.levelOptionSelected : ""}`}
          >
            {level.label}
          </div>
        );
      })}
    </div>
  );
}
