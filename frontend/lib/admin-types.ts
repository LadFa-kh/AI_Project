// Types for /admin dashboard. No backend endpoint exists yet — see
// PROJECT_CONTEXT.md "5) Admin Dashboard (Requested)" for the contract
// requested from backend. Mock data below stands in until it's wired.

export type AdminStats = {
  totalResumesUploaded: number;
  totalAssessmentsCompleted: number;
  totalMatchesGenerated: number;
  averageMatchScore: number;
};

// Mock data until backend is wired
// TODO: wire to backend — GET /admin/stats (see PROJECT_CONTEXT.md)
export const MOCK_ADMIN_STATS: AdminStats = {
  totalResumesUploaded: 128,
  totalAssessmentsCompleted: 94,
  totalMatchesGenerated: 356,
  averageMatchScore: 78,
};
