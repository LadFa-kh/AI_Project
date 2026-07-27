"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MatchCard } from "@/components/matches/match-card";
import { MatchFiltersBar } from "@/components/matches/match-filters";
import { MatchSort } from "@/components/matches/match-sort";
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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        // TODO: wire to backend (see PROJECT_CONTEXT.md: GET /internships/matches)
        await new Promise((resolve) => setTimeout(resolve, 600));
        if (cancelled) return;
        if (MOCK_MATCHES.length === 0) {
          setStatus("empty");
          return;
        }
        setMatches(MOCK_MATCHES);
        setStatus("success");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

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
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-[clamp(24px,6vw,48px)] dark:bg-black">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-6" style={{ maxWidth: "min(48rem, 92vw)" }}>
        <div className="flex flex-col gap-2">
          <Link
            href="/evaluation-result"
            className="w-fit text-sm font-medium text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 min-h-11 inline-flex items-center"
          >
            ← ย้อนกลับผลประเมิน
          </Link>
          <h1 className="text-[clamp(1.375rem,1.1rem+1.2vw,1.5rem)] font-semibold text-zinc-900 dark:text-zinc-50">
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

        {status === "loading" && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">กำลังโหลดรายการฝึกงาน...</p>
        )}

        {status === "error" && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            ไม่สามารถโหลดรายการฝึกงานได้ กรุณาลองใหม่อีกครั้ง
          </p>
        )}

        {status === "empty" && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            ยังไม่มีตำแหน่งฝึกงานที่ตรงกับผลประเมินของคุณ
          </p>
        )}

        {status === "success" && visibleMatches.length === 0 && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            ไม่พบตำแหน่งที่ตรงกับตัวกรองที่เลือก
          </p>
        )}

        {status === "success" && visibleMatches.length > 0 && (
          <div className="grid grid-cols-1 gap-4 min-[481px]:grid-cols-2 xl:grid-cols-3 min-[1440px]:grid-cols-4">
            {visibleMatches.map((match) => (
              <MatchCard key={match.internshipId} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
