# Claude Prompt Template (Token-Efficient)

Use this template for daily frontend tasks.

## Template

```md
[PROJECT]
Name: AI_Project
Context Files:
- frontend/PROJECT_CONTEXT.md
- frontend/TASK_BOARD.md
- frontend/AGENTS.md

[TASK]
Objective: <single frontend objective>
Definition of Done:
- [ ] <check 1>
- [ ] <check 2>

Constraints:
- Frontend scope only (`frontend/`)
- Minimal diff, no unrelated refactor
- Keep TypeScript compatibility
- If context is missing, ask up to 3 clarifying questions first

[FILES IN SCOPE]
- <absolute or repo-relative frontend file paths only>

[OUTPUT]
1) Plan (max 5 bullets)
2) Unified diff only
3) Verification checklist (lint/test/manual)
```

## Example (Resume Upload Task)

```md
Objective: Implement resume upload UI with file type validation.
Definition of Done:
- [ ] Accept .pdf/.doc/.docx
- [ ] Show error for unsupported file types
- [ ] Disable submit until file is valid

FILES IN SCOPE:
- frontend/app/upload/page.tsx
- frontend/components/resume-upload-form.tsx
```
