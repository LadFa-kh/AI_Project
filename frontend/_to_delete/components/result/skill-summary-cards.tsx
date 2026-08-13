import type { SkillSummary } from "@/lib/result-types";

type SkillSummaryCardsProps = {
  skills: SkillSummary[];
};

export function SkillSummaryCards({ skills }: SkillSummaryCardsProps) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">ทักษะเด่น</h2>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {skills.map((skill) => (
          <div
            key={skill.skillName}
            className="rounded-lg border border-zinc-300 p-3 text-center dark:border-zinc-700"
          >
            <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {skill.skillName}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{skill.level}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
