# ResuMate — Frontend

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · CSS Modules

หน้าเว็บของระบบวิเคราะห์เรซูเม่และประเมินสมรรถนะเบื้องต้นเพื่อแนะนำสถานประกอบการสำหรับนักศึกษา
(ภาพรวมทั้งระบบดู [`../README.md`](../README.md) · API ที่หน้าบ้านใช้ดู [`../API_CHANGES.md`](../API_CHANGES.md))

---

## หน้าเว็บทั้งหมด

| route | ใครใช้ | ทำอะไร |
|---|---|---|
| `/` | ทุกคน | หน้าแรก |
| `/login` (`/register` → redirect) | ทุกคน | เข้าสู่ระบบ / สมัคร (นักศึกษา หรือ ผู้ประกาศงาน) + Google Sign-In + ยอมรับนโยบาย |
| `/privacy-policy`, `/terms` | ทุกคน | นโยบายความเป็นส่วนตัว (PDPA) / ข้อกำหนดการใช้งาน |
| `/companies/[id]` | ทุกคน | โปรไฟล์บริษัท + ตำแหน่งที่เปิดรับ |
| `/upload-resume` | นักศึกษา | อัปโหลดเรซูเม่ (PDF) + เครดิตคงเหลือ |
| `/skill-assessment` | นักศึกษา | แบบประเมินตนเองแบบเลือกระดับ (พอใช้ / มาตรฐาน / ดี / ดีมาก) |
| `/evaluation-result` | นักศึกษา | คะแนน + ที่มาของคะแนน + สายงานที่เหมาะ 1–4 อันดับ + ทักษะที่ขาด + ป้าย AI |
| `/internship-matches`, `/internship-matches/[id]` | นักศึกษา | ตำแหน่งฝึกงานที่แนะนำ / รายละเอียดงาน |
| `/internships` | นักศึกษา | ประวัติฝึกงาน |
| `/employer/jobs` | ผู้ประกาศงาน | ประกาศงาน (สถานะ/วันเปิด-ปิด) · ผู้ฝึกงาน · ข้อมูลบริษัท |
| `/admin` | ผู้ดูแลระบบ | ภาพรวม · ผู้ใช้ · อนุมัติผู้ประกาศงาน · บริษัท/นำเข้า CSV · เรซูเม่ · ประกาศงาน · ฝึกงาน · การใช้งาน/ต้นทุน |
| `/settings` | ผู้ใช้ที่ล็อกอิน | ข้อมูลบัญชี · เครดิต · ประวัติ consent / ถอน · ดาวน์โหลดข้อมูล · ลบบัญชี |

ทุกหน้า (ยกเว้นที่เขียนว่า "ทุกคน") ต้องล็อกอิน — ควบคุมใน `components/layout/route-guard.tsx`

---

## รันในเครื่อง

```bash
cd frontend
npm ci
npm run dev        # http://localhost:3000
```

ต้องมี backend รันที่ `http://localhost:8080` (ดู [`../backend/README.md`](../backend/README.md)) — Next.js proxy `/api/*` ไปที่ backend ให้เอง (`next.config.ts`) จึงไม่มีปัญหา CORS และ cookie ทำงานได้

ตัวแปรสภาพแวดล้อม (`frontend/.env.local`):

| ชื่อ | ค่าปกติ | ใช้ทำอะไร |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `/api/v1` | prefix ของทุก API call |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | — | Google Sign-In |
| `BACKEND_INTERNAL_URL` | `http://localhost:8080` | ปลายทางของ proxy (ใน Docker = `http://backend:8080`, ส่งเป็น build arg) |

ตรวจก่อน push:

```bash
npm run lint
npm run build
```

---

## โครงสร้างโค้ด

```
app/                 route + page (server component บาง ๆ ที่ render view จาก components/)
components/
  auth/              ฟอร์ม login/register, consent modal, หน้ารออนุมัติ
  result/            หน้าผลลัพธ์ (score breakdown, career matches)
  matches/           รายการ/รายละเอียดตำแหน่งฝึกงาน
  companies/         โปรไฟล์บริษัท
  employer/          หน้าผู้ประกาศงาน (แท็บ)
  internships/       ประวัติฝึกงาน
  admin/             แดชบอร์ดแอดมิน (admin-dashboard-view.tsx + admin-ops-tabs.tsx)
  settings/          ตั้งค่าบัญชี
  layout/            TopNav, RouteGuard, DashboardShell, nav-items
  ui/                ชิ้นส่วนใช้ร่วม + nocturne.module.css
lib/
  api-client.ts      apiFetch, ApiError (มี code), describeError (ข้อความไทยตาม error code), unwrap/unwrapList
  *-service.ts       เรียก API แยกตามเรื่อง (auth, assessment, workplace, company, employer, internship, credit, account, admin, admin-ops)
  auth-context.tsx   สถานะผู้ใช้ (อ่านจาก GET /auth/me ด้วย cookie HttpOnly)
```

## กติกาที่ต้องรู้ก่อนแก้

- อ่าน [`AGENTS.md`](AGENTS.md) — Next.js เวอร์ชันนี้ต่างจากที่คุ้นเคย, กฎเรื่อง design token
- **ห้าม hardcode สี** ใช้ token ใน `app/globals.css` (`--nocturne-*`, `--color-home-hero-accent-1/2/3`) — รองรับธีมสว่าง/มืดทุกหน้า
- ฟอนต์หลักคือ **Noto Sans Thai** (`--font-sans`) โหลดผ่าน `next/font` ใน `app/layout.tsx`
- error จาก API ให้ตัดสินจาก `err.code` ไม่ใช่ `message` (`API_CHANGES.md` §5.0) และแสดงผลผ่าน `describeError()`
- response ของ backend บาง endpoint ห่อ `{status,message,data}` บางตัวไม่ห่อ → ใช้ `unwrap()` / `unwrapList()`
