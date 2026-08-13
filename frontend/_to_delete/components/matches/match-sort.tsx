import type { SortOption } from "@/lib/match-types";

type MatchSortProps = {
  value: SortOption;
  onChange: (value: SortOption) => void;
};

export function MatchSort({ value, onChange }: MatchSortProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="match-sort" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        เรียงตาม
      </label>
      <select
        id="match-sort"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="h-11 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="matchScore">คะแนนความเหมาะสมสูงสุด</option>
        <option value="newest">ใหม่ล่าสุด</option>
      </select>
    </div>
  );
}
