// Internship DETAIL page types. Backend has no "get one job by id" endpoint,
// so this page looks the job up from whatever list was last loaded on
// /internship-matches — either the matching list (lib/match-session.ts) or
// the "ทั้งหมด" /workplaces list (lib/workplace-session.ts), whichever store
// has that jobId. See internship-detail-view.tsx.

import type { DisplayJob } from "./internship-match-types";

export type InternshipDetail = DisplayJob;
