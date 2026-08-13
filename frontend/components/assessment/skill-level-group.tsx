"use client";

import type { KeyboardEvent } from "react";
import styles from "./skill-assessment.module.css";

type SkillLevelGroupProps = {
  questionId: string;
  options: string[];
  selected: string | null;
  disabled?: boolean;
  onSelect: (option: string) => void;
};

export function SkillLevelGroup({
  questionId,
  options,
  selected,
  disabled,
  onSelect,
}: SkillLevelGroupProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>, index: number) {
    if (disabled) return;
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      nextIndex = (index + 1) % options.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      nextIndex = (index - 1 + options.length) % options.length;
    }
    if (nextIndex !== null) {
      e.preventDefault();
      onSelect(options[nextIndex]);
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={`Answer for question ${questionId}`}
      className={styles.levelGroup}
    >
      {options.map((option, index) => {
        const isSelected = selected === option;
        return (
          <div
            key={option}
            role="radio"
            aria-checked={isSelected}
            aria-label={option}
            tabIndex={disabled ? -1 : isSelected || (!selected && index === 0) ? 0 : -1}
            onClick={() => !disabled && onSelect(option)}
            onKeyDown={(e) => {
              handleKeyDown(e, index);
              if (!disabled && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onSelect(option);
              }
            }}
            className={`${styles.levelOption} ${isSelected ? styles.levelOptionSelected : ""}`}
          >
            {option}
          </div>
        );
      })}
    </div>
  );
}
