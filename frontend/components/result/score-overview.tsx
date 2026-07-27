import { getScoreLevel, SCORE_LEVEL_LABEL } from "@/lib/result-types";

type ScoreOverviewProps = {
  score: number;
};

const LEVEL_BADGE_CLASS: Record<string, string> = {
  basic: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  good: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  excellent: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
};

export function ScoreOverview({ score }: ScoreOverviewProps) {
  const level = getScoreLevel(score);

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-zinc-300 p-6 text-center dark:border-zinc-700">
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">คะแนนรวม</p>
      <p className="text-5xl font-bold text-zinc-900 dark:text-zinc-50">{score}</p>
      <span
        className={`mt-1 rounded-full px-3 py-1 text-xs font-medium ${LEVEL_BADGE_CLASS[level]}`}
      >
        ระดับ: {SCORE_LEVEL_LABEL[level]}
      </span>
    </div>
  );
}
