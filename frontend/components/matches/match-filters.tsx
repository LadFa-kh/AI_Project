import { WORK_MODE_LABEL, type MatchFilters, type WorkMode } from "@/lib/match-types";

type MatchFiltersProps = {
  filters: MatchFilters;
  locationOptions: string[];
  onChange: (filters: MatchFilters) => void;
};

export function MatchFiltersBar({ filters, locationOptions, onChange }: MatchFiltersProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-workmode" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          รูปแบบงาน
        </label>
        <select
          id="filter-workmode"
          value={filters.workMode}
          onChange={(e) =>
            onChange({ ...filters, workMode: e.target.value as WorkMode | "all" })
          }
          className="h-11 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="all">ทั้งหมด</option>
          {(Object.keys(WORK_MODE_LABEL) as WorkMode[]).map((mode) => (
            <option key={mode} value={mode}>
              {WORK_MODE_LABEL[mode]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filter-location" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          จังหวัด/พื้นที่
        </label>
        <select
          id="filter-location"
          value={filters.location}
          onChange={(e) => onChange({ ...filters, location: e.target.value })}
          className="h-11 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="all">ทั้งหมด</option>
          {locationOptions.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
