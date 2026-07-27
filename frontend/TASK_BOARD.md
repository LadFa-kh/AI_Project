# Frontend Task Board

## Backlog
- [ ] Add API client layer + typed interfaces for backend contracts
- [ ] Add frontend tests for critical user flows
- [ ] Clean up dead/duplicate components in `components/matches/` (older Tailwind versions alongside Stardust versions — confirm unused before deleting; see AGENTS.md)
- [ ] Delete unused duplicate home components: `hero-section.tsx`, `how-it-works-section.tsx`
- [ ] Backend contract request: add per-skill match/gap indicator to `GET /internships/matches` list response (currently only the detail endpoint distinguishes matched vs. gap skills — list cards show all skills as "match" as a placeholder)
- [ ] Consolidate `lib/match-types.ts` and `lib/internship-match-types.ts` (duplicate/divergent types for the same domain — risk of prop-type mismatches, see AGENTS.md)

## In Progress
- [ ] Visual QA pass on Stardust theme across all 7 pages + shared navbar (spacing/sizing of reconstructed sidebar, score-ring, chip, wide-shell rules was inferred, not pixel-recovered from the original Nocturne file)

## Done
- [x] Initialize frontend project scaffold
- [x] Add AI collaboration context files for frontend team
- [x] Build auth pages (login/register) and Google Sign-In UX
- [x] Build resume upload page (PDF/Word validation + UX states)
- [x] Build skill assessment stepper (fixed level choices)
- [x] Build evaluation result view (score + recommendations)
- [x] Build internship match cards/list with filters/sort
- [x] Build internship match detail page
- [x] Add loading, empty, and error states across MVP flow pages
- [x] Add shared navbar/sidebar (AppShell) across all pages including Home
- [x] Switch design system from Nocturne (dark purple) to Stardust (dark orange/flat) — tokens, navbar, all 7 pages, Home page merged into shared shell
- [x] Fix `MatchCard` type mismatch and `.chipNeutral`/`.scorePill` missing styles (internship-matches list page)

## Team Working Notes
- Frontend changes only in `frontend/`.
- Backend touchpoints tracked as contracts/checklists only (no backend code edits).
- Keep PRs small: one feature flow per PR when possible.
- Design system: **Stardust** (see AGENTS.md for tokens and rules). Do not reintroduce Nocturne purple hex values.
