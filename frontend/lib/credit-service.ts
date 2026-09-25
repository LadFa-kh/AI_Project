// Monthly usage credits (API_CHANGES.md §5.8 B8).
// GET /users/me/credits -> { status, message, data: Credits }
// ADMIN: unlimited = true, monthlyLimit/remaining = null.
// Upload resume / submit assessment with no credits left -> 429 CREDITS_EXHAUSTED
// (credits are only deducted on success).

import { useCallback, useEffect, useState } from "react";
import { apiFetch, unwrap } from "./api-client";

export type Credits = {
  unlimited: boolean;
  monthlyLimit: number | null;
  used: number;
  remaining: number | null;
  resetAt: string | null;
  costs?: Record<string, number>;
};

export async function getMyCredits(): Promise<Credits> {
  const res = await apiFetch<unknown>("/users/me/credits", { method: "GET" });
  return unwrap<Credits>(res);
}

/** true only when we positively know the user is out of credits. */
export function isOutOfCredits(c: Credits | null): boolean {
  return !!c && !c.unlimited && c.remaining !== null && c.remaining <= 0;
}

/**
 * Loads credits once for the logged-in user. Failures are swallowed
 * (credits == null) — the counter is informational and must never block
 * the upload/submit flow if the endpoint is missing or errors.
 */
export function useCredits(enabled: boolean) {
  const [credits, setCredits] = useState<Credits | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    getMyCredits()
      .then((c) => {
        if (!cancelled) setCredits(c);
      })
      .catch(() => {
        if (!cancelled) setCredits(null);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  return { credits, refresh };
}
