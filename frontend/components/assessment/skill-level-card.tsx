import { SKILL_LEVELS, type SkillLevel } from "@/lib/assessment-types";

type SkillLevelCardProps = {
  skillName: string;
  selected: SkillLevel | null;
  onSelect: (level: SkillLevel) => void;
};

export function SkillLevelCard({ skillName, selected, onSelect }: SkillLevelCardProps) {
  return (
    <fieldset className="rounded-lg border border-zinc-300 p-4 dark:border-zinc-700">
      <legend className="px-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {skillName}
      </legend>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SKILL_LEVELS.map((level) => {
          const isSelected = selected === level.value;
          return (
            <button
              key={level.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(level.value)}
              className={`h-10 rounded-lg border text-sm font-medium transition-colors ${
                isSelected
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                  : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {level.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
