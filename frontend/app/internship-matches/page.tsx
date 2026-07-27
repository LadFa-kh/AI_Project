"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MatchCard } from "@/components/matches/match-card";
import { MatchFiltersBar } from "@/components/matches/match-filters";
import { MatchSort } from "@/components/matches/match-sort";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/page-state";
import {
  MOCK_MATCHES,
  type InternshipMatch,
  type MatchFilters,
  type SortOption,
} from "@/lib/match-types";

type Status = "loading" | "empty" | "error" | "success";

export default function InternshipMatchesPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [matches, setMatches] = useState<InternshipMatch[]>([]);
  const [sort, setSort] = useState<SortOption>("matchScore");
  const [filters, setFilters] = useState<MatchFilters>({
    workMode: "all",
    location: "all",
  });

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      // TODO: wire to backend (see PROJECT_CONTEXT.md: GET /internships/matches)
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (MOCK_MATCHES.length === 0) {
        setStatus("empty");
        return;
      }
      setMatches(MOCK_MATCHES);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const locationOptions = useMemo(
    () => Array.from(new Set(matches.map((m) => m.location))),
    [matches]
  );

  const visibleMatches = useMemo(() => {
    let result = matches;
    if (filters.workMode !== "all") {
      result = result.filter((m) => m.workMode === filters.workMode);
    }
    if (filters.location !== "all") {
      result = result.filter((m) => m.location === filters.location);
    }
    result = [...result].sort((a, b) =>
      sort === "matchScore"
        ? b.matchScore - a.matchScore
        : new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    );
    return result;
  }, [matches, filters, sort]);

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Link
            href="/evaluation-result"
            className="w-fit text-sm font-medium text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← ย้อนกลับผลประเมิน
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            สถานที่ฝึกงานที่เหมาะสม
          </h1>
        </div>

        {status === "success" && (
          <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <MatchFiltersBar
              filters={filters}
              locationOptions={locationOptions}
              onChange={setFilters}
            />
            <MatchSort value={sort} onChange={setSort} />
          </div>
        )}

        {status === "loading" && <LoadingState message="กำลังโหลดรายการฝึกงาน..." />}

        {status === "error" && (
          <ErrorState
            message="ไม่สามารถโหลดรายการฝึกงานได้ กรุณาลองใหม่อีกครั้ง"
            onRetry={load}
          />
        )}

        {status === "empty" && (
          <EmptyState message="ยังไม่มีตำแหน่งฝึกงานที่ตรงกับผลประเมินของคุณ" />
        )}

        {status === "success" && visibleMatches.length === 0 && (
          <EmptyState message="ไม่พบตำแหน่งที่ตรงกับตัวกรองที่เลือก" />
        )}

        {status === "success" && visibleMatches.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {visibleMatches.map((match) => (
              <MatchCard key={match.internshipId} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
