<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Design system
- Current design system is **Stardust** (dark, flat, no gradients): background `#030303`, card/surface `#0a0a0a`, primary/accent `#FC8337`, heading `#FFFFFF`, body `#E5E0FF`.
- Shared tokens/components live in `components/ui/nocturne.module.css` (filename kept for history — do not rename without updating every import).
- **Never hardcode Nocturne-era purple hex values** (`#9184d9`, `#a7a1db`, `#161826`, `#353b80`, `#2b2741`, `#262a3a`, `#e9e9ed`, etc.) — those are deprecated. Always reuse existing Stardust classes/tokens from `nocturne.module.css` or the `--color-home-*` CSS variables in `app/globals.css`.
- Composite classes are split by design (e.g. `.chip` = shape/layout, `.chipNeutral`/`.chipPositive`/etc. = color only). Always apply both together — a color-only class alone (e.g. `nocturne.chipNeutral` by itself) renders with no border-radius/padding. Check the class definition before assuming it's self-contained.

## Type contracts — avoid duplicate/mismatched types
- There are two parallel type sets for internship matches: `lib/match-types.ts` (older, has extra fields like `location`/`workMode`/`matchReason` not in the documented API contract) and `lib/internship-match-types.ts` (matches `PROJECT_CONTEXT.md`'s `GET /internships/matches` contract exactly). **Always check which type the calling view component actually imports and passes** before typing a child component's props — do not assume based on a component's file name or its prop type as previously written. A mismatch here silently renders `undefined` fields instead of throwing.
- Same caution applies to `lib/match-detail-types.ts` vs whatever the `/internship-matches/[id]` route actually uses.

## Known dead code (unconfirmed — verify before deleting)
- `components/matches/` contains older Tailwind-utility-class components (`match-action-panel.tsx`, `match-filters.tsx`, `match-sort.tsx`, `match-insight.tsx`, `match-detail-header.tsx`) alongside newer Stardust CSS-module components. Not yet confirmed whether these are dead code or still referenced somewhere — check actual imports before deleting.
- `components/home/hero-section.tsx` and `components/home/how-it-works-section.tsx` are unused duplicates of `home-hero.tsx` / `how-it-works-cards.tsx` (the ones actually wired into `app/page.tsx`).

## Dev server / stale build cache
- If the rendered page doesn't match the source code after an edit (wrong colors, old layout, missing changes), **suspect a stale `.next` build cache first** before assuming the code is wrong. Fix: stop the dev server, delete the `.next` folder, run `npm run dev` again.
