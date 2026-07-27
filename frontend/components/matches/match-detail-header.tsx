import { WORK_MODE_LABEL } from "@/lib/match-types";
import type { InternshipDetail } from "@/lib/match-detail-types";

type MatchDetailHeaderProps = {
  detail: InternshipDetail;
};

export function MatchDetailHeader({ detail }: MatchDetailHeaderProps) {
  return (
    <div className="rounded-lg border border-zinc-300 p-4 dark:border-zinc-700">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        {detail.title}
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{detail.company}</p>

      <dl className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">สถานที่ / รูปแบบงาน</dt>
          <dd className="text-zinc-800 dark:text-zinc-200">
            {detail.location} · {WORK_MODE_LABEL[detail.workMode]}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">ค่าตอบแทน</dt>
          <dd className="text-zinc-800 dark:text-zinc-200">
            {detail.stipend ?? "ไม่ระบุ"}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">ระยะเวลาฝึกงาน</dt>
          <dd className="text-zinc-800 dark:text-zinc-200">{detail.duration}</dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">ปิดรับสมัคร</dt>
          <dd className="text-zinc-800 dark:text-zinc-200">{detail.deadline}</dd>
        </div>
      </dl>
    </div>
  );
}
