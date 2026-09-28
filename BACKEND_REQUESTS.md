# BACKEND_REQUESTS: สิ่งที่ backend ขอให้ frontend ทำ

> ไฟล์นี้ backend เป็นคนดูแล (คู่กับ `FRONTEND_REQUESTS.md` ที่ frontend ดูแล)
> รายละเอียด endpoint / body / response อยู่ใน `API_CHANGES.md` หัวข้อ 5
> สถานะ: ☐ = ยังไม่ทำ · ☑ = เสร็จ
> อัปเดตล่าสุด: 28 ก.ย. 2569

---

## 1. ด่วน: หน้าผลการประเมินขึ้น "ไม่พบผลการประเมิน"

**ปัญหา:** `/evaluation-result` อ่านผลจาก `sessionStorage` อย่างเดียว ปิดแท็บ เปิดแท็บใหม่ หรือล็อกอินจากเครื่องอื่น → ผลหาย ทั้งที่ข้อมูลอยู่ในฐานข้อมูลครบ

**backend เพิ่มให้แล้ว:**

| method | path | ใช้ทำอะไร |
|---|---|---|
| GET | `/api/v1/assessments/me/latest` | ผลล่าสุดของผู้ใช้ |
| GET | `/api/v1/assessments/me` | ประวัติทุกรอบ (ย่อ) เรียงล่าสุดก่อน |
| GET | `/api/v1/assessments/me/{resumeId}` | ผลของเรซูเม่ที่เลือก |

- ☐ **หน้า `/evaluation-result`**: ถ้า `sessionStorage` ไม่มีผล ให้เรียก `GET /assessments/me/latest` แทนการขึ้น "ไม่พบผลการประเมิน"
  - ได้ 200 → `data` มีรูปแบบ**เดียวกับ response ของ `POST /assessments/submit`** ใช้ component เดิมแสดงได้เลย
  - ได้ 404 `NO_ASSESSMENT` → ค่อยขึ้น "ยังไม่มีผลการประเมิน" + ปุ่มไปทำแบบประเมิน (แบบเดิม)
- ☐ **รองรับ `partial: true`** (ผลของรอบที่ทำก่อน 28 ก.ย.): มีแค่ `resumeScore`, `assessmentScore`, `finalScore`, `missingSkills`, `recommendationSummary`, `roleUsedForMatching`, `submittedAt`
  → **ไม่มี** `scoreBreakdown`, `careerMatches`, `scoreExplanation` และ `recommendationItems` เป็น `[]` ให้ซ่อนส่วนนั้นแทนการพัง
- ☐ (ไม่บังคับ) **หน้าประวัติการประเมิน**: ใช้ `GET /assessments/me` แสดงรายการ กดแล้วเปิด `/assessments/me/{resumeId}`

ตัวอย่าง `GET /assessments/me/latest`:
```json
{ "status": 200, "message": "OK", "data": {
  "resumeId": "…", "resumeScore": 77.5, "assessmentScore": 100.0, "finalScore": 86.5,
  "missingSkills": ["…"], "recommendationSummary": "…", "recommendationItems": ["…"],
  "scoreBreakdown": { "…": "…" }, "scoreExplanation": "…", "careerMatches": [ { "…": "…" } ],
  "submittedAt": "2026-09-28T10:15:00Z", "partial": false } }
```

ตัวอย่าง `GET /assessments/me`:
```json
{ "status": 200, "message": "OK", "data": [
  { "resumeId": "…", "originalFilename": "CV.pdf", "finalScore": 86.5,
    "roleUsedForMatching": "Software Developers, Applications", "submittedAt": "2026-09-28T10:15:00Z", "partial": false } ] }
```

---

## 2. ฟิลด์ใหม่ที่ขอให้ใช้ (ตามที่ frontend ขอมา)

- ☐ `careerMatches[].roleNameTh` แสดงชื่อไทย ถ้าไม่มีให้แสดง `roleName`
- ☐ `requiredSkillsDetail` ในการ์ดงาน (มีเฉพาะตอนล็อกอินและเคยอัปโหลดเรซูเม่) แยกสีทักษะที่มี / ยังขาด ถ้าไม่มีฟิลด์นี้ให้ใช้ `requiredSkills` แบบเดิม
- ☐ ข้อความ 403 `EMPLOYER_REJECTED` แสดง `message` ตรง ๆ (มีเหตุผลที่แอดมินกรอกอยู่แล้ว)

---

## 3. หน้าจอที่ยังไม่มี (จาก `API_CHANGES.md` 5.11) เรียงตามความสำคัญ

| ☐ | งาน | endpoint |
|---|---|---|
| ☐ | หน้า `/privacy-policy` (เนื้อหาร่างอยู่ที่ `docs/PRIVACY_POLICY_TH.md` รอเจ้าของโครงงานตรวจ) | `GET /policies/current` |
| ☐ | หน้าโปรไฟล์บริษัท + ลิงก์จากการ์ดงาน | `GET /companies/{id}`, `/companies/{id}/jobs` |
| ☐ | ผู้ประกาศงาน: แก้ข้อมูลบริษัท + เปิด/ปิดประกาศ + วันที่ | `GET/PUT /companies/me`, `PATCH /jobs/{id}/status` |
| ☐ | แสดงเครดิตคงเหลือ + ข้อความเมื่อได้ 429 `CREDITS_EXHAUSTED` / `RATE_LIMITED` | `GET /users/me/credits` |
| ☐ | ประวัติฝึกงาน (นักศึกษา / บริษัท) | `/internships/me`, `/employer/internships` |
| ☐ | แอดมิน: import บริษัท + รายงานการใช้งาน + **Cost per action** | `/admin/companies/import`, `/admin/usage`, `/admin/usage/cost` |
| ☐ | ตั้งค่าบัญชี: ดาวน์โหลดข้อมูล / ถอนความยินยอม / ลบบัญชี | `/users/me/data-export`, `/users/me/consents`, `DELETE /users/me` |
| ☐ | ป้าย "AI" ในทักษะที่จับคู่แบบ SEMANTIC | `scoreBreakdown.matchDetails` |

---

## 4. ข้อตกลงร่วม

- ☐ ถ้าส่งแบบประเมินแล้วได้ 500 (เกิน 30 วินาที) ให้เพิ่ม `experimental: { proxyTimeout: 90000 }` ใน `next.config.ts`
- ☐ **แจ้ง backend เมื่อหน้า `/privacy-policy` เสร็จ** เพื่อเปิดบังคับยอมรับนโยบายตอนสมัคร (`requiredOnRegister` → `true`)
- ทดสอบบน production ได้ แต่ใช้บัญชี `@test.com` เท่านั้น, import บริษัทใช้ `dryRun=true`, และลบบัญชีได้เฉพาะบัญชีทดสอบของตัวเอง
- error ทุกตัวมี `code` ให้ตัดสินใจจาก `code` ไม่ใช่ `message`
- frontend push แล้วบอก backend เพื่อ build ขึ้น production (production อยู่บนเครื่องของ backend)
