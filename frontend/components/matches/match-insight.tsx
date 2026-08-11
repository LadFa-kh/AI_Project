import type { InternshipDetail } from "@/lib/match-detail-types";

type MatchInsightProps = {
  detail: InternshipDetail;
};

export function MatchInsight({ detail }: MatchInsightProps) {
  return (
    <div className="rounded-lg border border-zinc-300 p-4 dark:border-zinc-700">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          ความเหมาะสมกับโปรไฟล์ของคุณ
        </h2>
        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
          {detail.matchScore}%
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{detail.matchReason}</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">ทักษะที่ตรงกัน</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {detail.matchedSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-950 dark:text-green-300"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">ทักษะที่ยังขาด</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {detail.missingSkills.length === 0 ? (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">ไม่มี</span>
            ) : (
              detail.missingSkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                >
                  {skill}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
