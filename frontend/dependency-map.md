# AI_Project Frontend — Dependency Map

สรุปว่าไฟล์ไหนเชื่อมกับไฟล์ไหน โดยเฉพาะ `lib/` (API layer) ที่ component ไหนเรียกใช้บ้าง — สร้างจากการ grep import statement จริงในโค้ด ไม่ใช่การเดา

## lib/ (API + types + state) — ใครเรียกใช้บ้าง

| lib file | ทำหน้าที่ | ถูกเรียกจาก |
|---|---|---|
| `api-client.ts` | fetch wrapper กลาง (ApiError/NetworkError) | `auth-service.ts` |
| `auth-service.ts` | `login()`, `register()` — POST /auth/login, /auth/register | `auth-context.tsx`, `login-form.tsx`, `register-form.tsx` |
| `auth-context.tsx` | `useAuth()`, session state (localStorage) | `route-guard.tsx`, `auth-status.tsx`, `navbar.tsx`, `mobile-topbar.tsx`, `home-hero.tsx`, `resume-upload-card.tsx`, `admin-guard.tsx`, `login-form.tsx`, `register-form.tsx` |
| `resume-service.ts` | `uploadResume()` — POST /resumes/upload | `resume-upload-card.tsx`, `resume-session.ts` |
| `resume-session.ts` | sessionStorage hand-off (resumeId + questions) | `resume-upload-card.tsx`, `skill-assessment-card.tsx` |
| `validators.ts` | validateEmail/Password/ResumeFile, sanitizeExternalUrl | `resume-upload-card.tsx`, `resume-dropzone.tsx`, `internship-detail-view.tsx` |
| `assessment-types.ts` | AssessmentQuestion/Answers type | `skill-assessment-card.tsx` |
| `result-types.ts` | EvaluationResult type + mock | `evaluation-result-card.tsx`, `score-badge.tsx`, `match-score-pill.tsx` |
| `internship-match-types.ts` | InternshipMatchSummary type + mock (backend contract จริง) | `internship-matches-view.tsx`, `match-card.tsx`, `matches-control-bar.tsx`, `internship-detail-types.ts` |
| `internship-detail-types.ts` | InternshipDetail type + mock | `internship-detail-view.tsx` |
| `admin-types.ts` | AdminStats type + mock | `admin-dashboard-view.tsx` |

**หมายเหตุ:** ตอนนี้ backend ต่อจริงแล้วมีแค่ 2 จุด — `auth-service.ts` (login/register) และ `resume-service.ts` (upload resume) ที่เหลือยังเป็น mock data รอ backend เพิ่ม endpoint

## app/ pages → component หลักที่ใช้

| Route | Page component | เรียก |
|---|---|---|
| `/` | `page.tsx` | `home-hero.tsx`, `how-it-works-cards.tsx`, `benefits-section.tsx`, `footer-section.tsx`, `horizontal-page-scroll.tsx` |
| `/login` | `login/page.tsx` | `login-form.tsx` |
| `/register` | `register/page.tsx` | `register-form.tsx` |
| `/upload-resume` | `upload-resume/page.tsx` | `upload-resume-flow.tsx` → `resume-upload-card.tsx` |
| `/skill-assessment` | `skill-assessment/page.tsx` | `skill-assessment-flow.tsx` → `skill-assessment-card.tsx` |
| `/evaluation-result` | `evaluation-result/page.tsx` | `evaluation-result-card.tsx` |
| `/internship-matches` | `internship-matches/page.tsx` | `internship-matches-view.tsx` → `match-card.tsx` |
| `/internship-matches/[id]` | `internship-matches/[id]/page.tsx` | `internship-detail-view.tsx` |
| `/admin` | `admin/page.tsx` | `admin-guard.tsx` (role check) → `admin-dashboard-view.tsx` |

ทุกหน้า (ยกเว้น `/login`, `/register`) ถูกครอบด้วย `app-shell.tsx` → `route-guard.tsx` (บังคับ login) ผ่าน `app/layout.tsx`

## components/layout/ — โครง navbar/sidebar

```
app-shell.tsx
├── navbar.tsx (desktop sidebar)
│   ├── auth-status.tsx      → lib/auth-context.tsx
│   ├── process-stepper.tsx  (upload→assessment→result indicator)
│   └── nav-items.tsx        (รายการเมนู, adminOnly flag)
├── mobile-topbar.tsx (มือถือ, structure เดียวกับ navbar)
└── route-guard.tsx          → lib/auth-context.tsx (บังคับ login ทุกหน้ายกเว้น /)
```

`admin/admin-guard.tsx` เป็นชั้นที่สอง (เช็ค `role === "ADMIN"`) ครอบเฉพาะ `/admin` เพิ่มเติมจาก `route-guard.tsx`

## Dead code (ย้ายไป `_to_delete/` แล้ว — ไม่อยู่ใน map นี้)

`auth-form.tsx`, `resume-upload-form.tsx`, `file-dropzone.tsx`, `match-action-panel.tsx`, `match-detail-header.tsx`, `match-insight.tsx`, `match-filters.tsx`, `match-sort.tsx`, `insight-sections.tsx`, `score-overview.tsx`, `skill-summary-cards.tsx`, `page-state.tsx`, `skill-level-card.tsx`, `lib/match-types.ts`, `lib/match-detail-types.ts`

**หมายเหตุ:** `components/auth/google-signin-button.tsx` ยังอยู่ใน live tree แต่ไม่มีไฟล์ไหน import เลย (ไม่ถูกจัดเป็น dead code เพราะเก็บไว้รอ Google login ในอนาคตตามที่เคยตกลงกัน)
