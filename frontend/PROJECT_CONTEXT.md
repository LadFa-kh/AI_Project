# Project Context (Frontend)

## Product Summary
AI_Project is a resume analysis and intelligent skill assessment system that uses Generative AI to match students with suitable internship opportunities.

## Scope for Frontend Team
- Authentication UI: Login, Register, Google Sign-In
- Resume upload UX: PDF/Word selection, validation, progress
- Skill assessment UX: guided multiple-choice levels per detected skill
- Results UI: score summary, strengths/gaps, matched internships

> This file is frontend-focused. Backend implementation is out of scope here.

## Core Product Flow
1. User signs in (email/password or Google).
2. User uploads resume (`.pdf`, `.doc`, `.docx`).
3. System receives extracted resume skills (from backend pipeline).
4. User answers skill-level questions per skill (fixed levels, not free-text generation).
5. AI evaluation returns score + concise recommendations.
6. UI shows internship matches from database-driven results.

## Current Status
- Frontend app scaffold exists (Next.js + TypeScript + Tailwind).
- Main business screens are pending implementation.
- Documentation/context workflow for AI-assisted execution is now established.

## AI Prompting Constraints (Token-Saving)
- Always send only task-relevant files/snippets.
- Reuse fixed prompt template and output format.
- Prefer structured input/output (JSON schema) for API tasks.
- Do not paste full raw resume text unless required.
- Keep each prompt to one objective and one Definition of Done.

## Frontend ↔ Backend Touchpoints (Checklist Only)
- [ ] Auth endpoints contract confirmed (login/register/google callback).
- [ ] Resume upload API contract confirmed (file type/size/errors).
- [ ] Resume extracted skills response shape confirmed.
- [ ] Skill assessment submit payload/response contract confirmed.
- [ ] Internship match result schema confirmed.
