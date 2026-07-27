import Link from "next/link";
import { WORK_MODE_LABEL, type InternshipMatch } from "@/lib/match-types";

type MatchCardProps = {
  match: InternshipMatch;
};

export function MatchCard({ match }: MatchCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-300 p-4 dark:border-zinc-700">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {match.title}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{match.company}</p>
        </div>
        <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
          {match.matchScore}%
        </span>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {match.location} · {WORK_MODE_LABEL[match.workMode]}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {match.requiredSkills.map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {skill}
          </span>
        ))}
      </div>

      <p className="text-xs text-zinc-600 dark:text-zinc-400">{match.matchReason}</p>

      <Link
        href={`/internship-matches/${match.internshipId}`}
        className="mt-1 flex h-9 w-full items-center justify-center rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        ดูรายละเอียด
      </Link>
    </div>
  );
}
