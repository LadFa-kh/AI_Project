"use client";

import { use, useEffect, useState } from "react";
import { MatchDetailHeader } from "@/components/matches/match-detail-header";
import { MatchInsight } from "@/components/matches/match-insight";
import { MatchActionPanel } from "@/components/matches/match-action-panel";
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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        // TODO: wire to backend (see contract checklist: GET /internships/:id)
        await new Promise((resolve) => setTimeout(resolve, 600));
        if (cancelled) return;
        const found = MOCK_MATCH_DETAILS[id];
        if (!found) {
          setStatus("not-found");
          return;
        }
        setDetail(found);
        setStatus("success");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">กำลังโหลดรายละเอียด...</p>
      </div>
    );
  }

  if (status === "not-found") {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          ไม่พบตำแหน่งฝึกงานที่คุณต้องการ
        </p>
      </div>
    );
  }

  if (status === "error" || !detail) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          ไม่สามารถโหลดรายละเอียดได้ กรุณาลองใหม่อีกครั้ง
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-[clamp(24px,6vw,48px)] dark:bg-black">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-4" style={{ maxWidth: "min(42rem, 90vw)" }}>
        <MatchDetailHeader detail={detail} />
        <MatchInsight detail={detail} />
        <MatchActionPanel detail={detail} />
      </div>
    </div>
  );
}
