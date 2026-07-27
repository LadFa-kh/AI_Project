# Claude Prompt Template (Token-saving, Frontend-first)

## เปิดงานสั้น (แนะนำ)
```md
ใช้โหมดประหยัด token: ตอบสั้น, ถ้าข้อมูลไม่พอถามไม่เกิน 2 ข้อ, ส่ง Plan สั้น + diff only + test checklist, และแก้เฉพาะ frontend ตาม scope นี้: ...
```

## Template มาตรฐาน
```md
[PROJECT]
Name: AI_Project
Context Files:
- frontend/PROJECT_CONTEXT.md
- frontend/TASK_BOARD.md
- frontend/AGENTS.md

[TASK]
Objective: <งานเดียว>
Definition of Done:
- [ ] <ข้อที่ 1>
- [ ] <ข้อที่ 2>

Constraints:
- Frontend scope only (`frontend/`)
- Never edit files outside `frontend/`; if backend is required, return contract/checklist only.
- Minimal diff, no unrelated refactor
- Keep TypeScript compatibility
- If context is missing, ask up to 3 clarifying questions first

[FILES IN SCOPE]
- <เฉพาะไฟล์ที่เกี่ยวข้อง>

[OUTPUT]
1) Plan (max 5 bullets)
2) Unified diff only
3) Verification checklist (lint/test/manual)
```
