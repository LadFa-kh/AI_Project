type AssessmentProgressProps = {
  answered: number;
  total: number;
};

export function AssessmentProgress({ answered, total }: AssessmentProgressProps) {
  const percent = total === 0 ? 0 : Math.round((answered / total) * 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
        <span>ตอบแล้ว {answered}/{total} ข้อ</span>
        <span>{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-1 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
      >
        <div
          className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-50"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
