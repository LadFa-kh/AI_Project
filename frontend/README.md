# AI_Project Frontend

## Overview
Frontend for an AI-assisted student career workflow:
- Resume analysis
- Skill assessment
- Internship matching

## Frontend Scope Boundaries
- Edit only files under `frontend/`.
- No backend implementation changes in this scope.
- If backend work is needed, provide API contracts/checklists only.

## Current Frontend Flow / Pages
Current routes in app:
- `/` (current scaffold page)

Target product flow pages (frontend roadmap):
1. Login/Register (+ Google Sign-In)
2. Resume Upload (`.pdf`, `.doc`, `.docx`)
3. Skill Assessment (choice-based levels)
4. Evaluation Result (score + recommendations)
5. Internship Match List
6. Match Detail

## Local Run
From `/frontend`:

```bash
npm ci
npm run dev
```

Optional checks:

```bash
npm run lint
npm run build
```

## Suggested Folder / Module Ownership (Frontend)
- `app/` — routes, layouts, page-level UI
- `components/` — reusable UI components
- `lib/` — API client, request helpers, shared utilities
- `types/` — shared TypeScript interfaces/contracts
- `app/globals.css` — global styles/tokens

## Collaboration Notes (Claude/Copilot, Token-Efficient)
- Treat `frontend/PROJECT_CONTEXT.md` as project source of truth.
- Keep prompts to one objective per request.
- Return concise output: short plan + diff only + short verification checklist.
- Do not paste whole files unless requested.
- Keep diffs minimal and limited to scoped frontend files.
