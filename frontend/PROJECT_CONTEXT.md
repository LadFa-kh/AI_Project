# Project Context (Frontend)

## Project Goal
Build a frontend experience for students to:
1) upload resume,
2) complete skill assessment,
3) receive AI evaluation,
4) view matched internships.

## Frontend Scope Boundary
- This document governs frontend collaboration under `frontend/` only.
- Backend implementation is out of scope; backend needs must be documented as contracts/checklists.

## User Flow
1. User signs in (email/password or Google).
2. User uploads resume file (`.pdf`, `.doc`, `.docx`).
3. Frontend receives extracted skills from backend.
4. User selects a level per skill (no free-text answers).
5. Frontend submits assessment answers.
6. Frontend shows evaluation summary and internship matches.

## Skill Level Scale
- Basic
- Meets Expectations
- Strong
- Excellent

## Frontend-Expected Backend API Contracts (High-Level)

### 1) Auth
- Request examples:
  - `POST /auth/login` → `{ email, password }`
  - `POST /auth/register` → `{ name, email, password }`
  - `POST /auth/google` → `{ idToken }`
- Response shape:
  - `{ accessToken, user: { id, name, email } }`

### 2) Resume Upload + Skill Extraction
- Request example:
  - `POST /resumes` (multipart form-data) with `file`
- Response shape:
  - `{ resumeId, extractedSkills: [{ skillName, source? }] }`

### 3) Skill Assessment Submit
- Request example:
  - `POST /assessments` → `{ resumeId, answers: [{ skillName, level }] }`
- Response shape:
  - `{ assessmentId, overallScore, recommendations, strengths, gaps }`

### 4) Internship Matching
- Request example:
  - `GET /internships/matches?assessmentId=<id>`
- Response shape:
  - `{ matches: [{ internshipId, title, company, matchScore, requiredSkills }], total }`

## Token-Saving Prompting Constraints
- Always read `frontend/PROJECT_CONTEXT.md`, `frontend/TASK_BOARD.md`, and `frontend/AGENTS.md` first.
- Keep each prompt to one objective and one Definition of Done.
- Return concise structure: short plan + focused diff + short validation checklist.
- Avoid repeating unchanged project context.
- Never edit files outside `frontend/`; if backend is required, return contract/checklist only.
