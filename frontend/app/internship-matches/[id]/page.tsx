"use client";

import { use, useCallback, useEffect, useState } from "react";
import { MatchDetailHeader } from "@/components/matches/match-detail-header";
import { MatchInsight } from "@/components/matches/match-insight";
import { MatchActionPanel } from "@/components/matches/match-action-panel";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/page-state";
import { MOCK_MATCH_DETAILS, type InternshipDetail } from "@/lib/match-detail-types";

type Status = "loading" | "not-found" | "error" | "success";

export default function InternshipMatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [status, setStatus] = useState<Status>("loading");
  const [detail, setDetail] = useState<InternshipDetail | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      // TODO: wire to backend (see contract checklist: GET /internships/:id)
      await new Promise((resolve) => setTimeout(resolve, 600));
      const found = MOCK_MATCH_DETAILS[id];
      if (!found) {
        setStatus("not-found");
        return;
      }
      setDetail(found);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (status === "loading") {
    return (
      <div className="flex flex-1 bg-zinc-50 px-4 py-12 dark:bg-black">
        <LoadingState message="กำลังโหลดรายละเอียด..." />
      </div>
    );
  }

  if (status === "not-found") {
    return (
      <div className="flex flex-1 bg-zinc-50 px-4 py-12 dark:bg-black">
        <EmptyState message="ไม่พบตำแหน่งฝึกงานที่คุณต้องการ" />
      </div>
    );
  }

  if (status === "error" || !detail) {
    return (
      <div className="flex flex-1 bg-zinc-50 px-4 py-12 dark:bg-black">
        <ErrorState
          message="ไม่สามารถโหลดรายละเอียดได้ กรุณาลองใหม่อีกครั้ง"
          onRetry={load}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
        <MatchDetailHeader detail={detail} />
        <MatchInsight detail={detail} />
        <MatchActionPanel detail={detail} />
      </div>
    </div>
  );
}
