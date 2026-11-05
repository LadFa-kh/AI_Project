# ระบบ ResuMate ณ วันขึ้นสอบ (23 ก.ย. 2569)

> อ้างอิง commit `48d877b` (21 ก.ย. 2569 15:17) ซึ่งเป็น commit สุดท้ายก่อนวันสอบ
> ชุด B1–B11 เข้ามาวันที่ 24 ก.ย. 04:57 (หลังสอบ) จึงไม่นับรวมในเอกสารนี้
> ดูโค้ดของวันนั้นได้ด้วย `git worktree add ..\AI_Project_0921 48d877b`

---

## 1. ภาพรวมสถาปัตยกรรม

| ส่วน | เทคโนโลยี | หน้าที่ |
|---|---|---|
| Frontend | Next.js 16.2 / React 19.2 / Tailwind CSS 4 | หน้าเว็บทั้งหมด ส่งต่อคำขอ `/api/*` ไปที่ backend |
| Backend | Spring Boot 3.3.2 / Java 21 / Spring Security + JWT (cookie) | API หลัก, คิดคะแนน, จับคู่งาน, จัดการผู้ใช้ |
| AI Service | FastAPI (Python) `main.py` | อ่าน PDF, ตัดคำภาษาไทย, เรียก LLM |
| LLM | Gemini `gemini-3.1-flash-lite-preview` ผ่าน CometAPI | สกัดทักษะ, สร้างคำถาม, แปล/เดาตำแหน่งงาน, เขียนคำแนะนำ |
| Database | PostgreSQL 16 (JPA `ddl-auto=update`) | เก็บข้อมูลทั้งหมด + ตารางทักษะมาตรฐาน O*NET |
| Deploy | Docker Compose + Cloudflare Tunnel | เปิดใช้งานที่ `app.recommendation.site` |

ผู้ใช้ 3 บทบาท: **STUDENT** (นักศึกษา/ผู้หางาน), **EMPLOYER** (ผู้ประกอบการ), **ADMIN** (ผู้ดูแลระบบ)
เข้าสู่ระบบได้ 2 แบบ: อีเมล + รหัสผ่าน (LOCAL) และ Google (GOOGLE)

---

## 2. หน้าเว็บ (Frontend)

| หน้า | path | ใช้โดย | หน้าที่ |
|---|---|---|---|
| หน้าแรก | `/` | ทุกคน | แนะนำระบบ |
| สมัครสมาชิก | `/register` | ทุกคน | สมัครด้วยอีเมล หรือ Google |
| เข้าสู่ระบบ | `/login` | ทุกคน | ล็อกอินอีเมล หรือ Google |
| อัปโหลดเรซูเม่ | `/upload-resume` | STUDENT | อัปโหลด PDF (ไม่เกิน 5MB) และกรอกตำแหน่งงานที่ต้องการ (ไม่บังคับ) |
| แบบประเมินทักษะ | `/skill-assessment` | STUDENT | ตอบคำถามประเมินตนเองที่ AI สร้างจากเรซูเม่ |
| ผลการประเมิน | `/evaluation-result` | STUDENT | คะแนน 3 ส่วน, ที่มาของคะแนน, ทักษะที่ขาด, คำแนะนำ |
| จับคู่งาน/ฝึกงาน | `/internship-matches` | STUDENT | งานที่ทักษะตรงที่สุด 5 อันดับ พร้อมทักษะที่ตรง/ที่ขาด |
| ผู้ประกอบการ | `/employer` | EMPLOYER | ลง/แก้/ลบประกาศงานของตนเอง |
| ผู้ดูแลระบบ | `/admin` | ADMIN | Dashboard, จัดการผู้ใช้ เรซูเม่ และประกาศงาน |

---

## 3. ขั้นตอนการทำงานหลัก (ฝั่งผู้หางาน)

1. **อัปโหลดเรซูเม่**: backend เก็บไฟล์ (ชื่อไฟล์สุ่มด้วย UUID และตรวจซ้ำด้วย SHA-256) แล้วส่งไปที่ AI Service
2. **AI Service**:
   - อ่านข้อความจาก PDF และตัดคำภาษาไทย
   - ให้ LLM สกัดทักษะ แยกเป็น HARD และ SOFT
   - ให้ LLM สร้างคำถามประเมินตนเองไม่เกิน 5 ข้อ ตัวเลือกคงที่ 4 ระดับ: 1. พอใช้ / 2. มาตรฐาน / 3. ดี / 4. ดีมาก
3. **ทำแบบประเมิน** แล้วส่งคำตอบ (`POST /assessments/submit`)
4. **หาตำแหน่งงานเป้าหมาย**:
   - ถ้าผู้ใช้กรอกไว้ → LLM แปลเป็นชื่ออาชีพมาตรฐาน O*NET ภาษาอังกฤษ
   - ถ้าไม่กรอก → LLM เดาตำแหน่งที่เหมาะที่สุดจากทักษะ HARD
5. **คิดคะแนน** (ดูข้อ 4)
6. **AI เขียนคำแนะนำ**: ทักษะที่ขาด, สรุปคำแนะนำ 1 ย่อหน้า, คำแนะนำแยกเป็นข้อ 3–5 ข้อ และคำอธิบายที่มาของคะแนน (ห้าม LLM คำนวณตัวเลขเอง ให้ใช้ตัวเลขจากระบบเท่านั้น)
7. **จับคู่งาน**: เทียบทักษะผู้ใช้กับทักษะที่แต่ละงานต้องการ แล้วแสดง 5 อันดับแรก

---

## 4. สูตรการคิดคะแนน

### 4.1 คะแนนเรซูเม่ (Resume Score, เต็ม 100)
1. ดึงทักษะมาตรฐานของตำแหน่งเป้าหมายจากตาราง O*NET (`software_skills`)
2. จับคู่ทักษะ HARD ในเรซูเม่กับทักษะมาตรฐานแบบ word boundary ทั้งสองทาง
3. `precision = (จำนวนทักษะที่จับคู่ได้ / จำนวนทักษะ HARD ทั้งหมดในเรซูเม่) × 100`
4. คูณตัวถ่วง (penalty) ตามจำนวนที่จับคู่ได้ เพื่อไม่ให้คะแนนสูงเกินจริง:
   | จับคู่ได้ | ตัวถ่วง |
   |---|---|
   | 0 ทักษะ | 0 |
   | 1 ทักษะ | 0.3 |
   | 2 ทักษะ | 0.6 |
   | ตั้งแต่ 3 ทักษะ | 1.0 |
5. `Resume Score = min(100, precision × ตัวถ่วง)`

### 4.2 คะแนนแบบประเมิน (Assessment Score, เต็ม 100)
`Assessment Score = (ผลรวมคะแนนที่เลือก / (จำนวนข้อ × 4)) × 100` (แต่ละข้อได้ 1–4 คะแนน)

### 4.3 คะแนนรวม (Final Score)
`Final Score = Resume Score × 0.6 + Assessment Score × 0.4` (ปัดทศนิยม 2 ตำแหน่ง)

### 4.4 เปอร์เซ็นต์ความตรงของงาน (Job Matching)
`match % = (ทักษะที่งานต้องการซึ่งผู้ใช้มี / ทักษะที่งานต้องการทั้งหมด) × 100` เรียงจากมากไปน้อย แล้วแสดง 5 อันดับแรก

---

## 5. API ของ Backend (ทั้งหมด ณ วันนั้น)

| กลุ่ม | Method + Path | สิทธิ์ | หน้าที่ |
|---|---|---|---|
| Auth | `POST /api/v1/auth/register` | ทุกคน | สมัครสมาชิก |
| | `POST /api/v1/auth/login` | ทุกคน | เข้าสู่ระบบ (คืน JWT ใน cookie) |
| | `POST /api/v1/auth/google` | ทุกคน | เข้าสู่ระบบด้วย Google |
| | `POST /api/v1/auth/logout` | ล็อกอิน | ออกจากระบบ |
| | `GET /api/v1/auth/me` | ล็อกอิน | ข้อมูลผู้ใช้ปัจจุบัน |
| Resume | `POST /api/v1/resumes/upload` | STUDENT | อัปโหลด PDF → ทักษะ + คำถาม |
| Assessment | `POST /api/v1/assessments/submit` | STUDENT | ส่งคำตอบ → คะแนน + คำแนะนำ |
| Matching | `GET /api/v1/matching/recommendations` | STUDENT | งานที่ตรงที่สุด 5 อันดับ |
| Skills | `GET /api/v1/skills/search` | ทุกคน | ค้นหาชื่อทักษะ |
| Jobs | `GET /api/v1/workplaces`, `GET /api/v1/workplaces/{id}` | ทุกคน | ดูประกาศงาน |
| | `POST /api/v1/jobs` | EMPLOYER/ADMIN | ลงประกาศงาน |
| Employer | `GET/POST /api/v1/employer/jobs`, `PUT/DELETE /api/v1/employer/jobs/{id}` | EMPLOYER | จัดการงานของตนเอง |
| Admin | `GET /api/v1/admin/dashboard` | ADMIN | สถิติภาพรวม |
| | `GET/PUT/DELETE /api/v1/admin/users[/{id}]` | ADMIN | จัดการผู้ใช้ |
| | `GET/DELETE /api/v1/admin/resumes[/{id}]` | ADMIN | จัดการเรซูเม่ |
| | `GET/POST/PUT/DELETE /api/v1/admin/jobs[/{id}]` | ADMIN | จัดการประกาศงาน |

**API ภายในของ AI Service** (backend เป็นผู้เรียก ไม่เปิดสู่ภายนอก)

| Path | หน้าที่ |
|---|---|
| `POST /api/v1/python/process-resume` | อ่าน PDF → สกัดทักษะ + สร้างคำถาม |
| `POST /api/v1/python/generate-recommendation` | ทักษะที่ขาด + คำแนะนำ + คำอธิบายคะแนน |
| `POST /api/v1/python/translate-role-name` | แปลชื่อตำแหน่งเป็นชื่ออาชีพ O*NET |
| `POST /api/v1/python/infer-role-from-skills` | เดาตำแหน่งจากทักษะ (กรณีไม่กรอก) |

---

## 6. ฐานข้อมูล (13 ตาราง)

| ตาราง | เก็บอะไร | คอลัมน์สำคัญ |
|---|---|---|
| `users` | ผู้ใช้ | email, full_name, telephone, password_hash, role, google_id, created_at |
| `refresh_tokens` | token ต่ออายุการล็อกอิน | token, expiry_date, user_id |
| `resumes` | ไฟล์เรซูเม่ | user_id, file_path, stored_filename, original_filename, file_hash, uploaded_at |
| `resume_skills` | ทักษะที่สกัดได้ | resume_id, skill_name, skill_type (HARD/SOFT) |
| `assessment_question` | คำถามที่ AI สร้าง | resume_id, question_text, options_a–d |
| `assessment_answers` | คำตอบ | question_id, user_id, selected_score, answered_at |
| `assessment_score` | คะแนนแบบประเมิน | resume_id, user_id, assessment_score, submitted_at |
| `resume_score` | คะแนนเรซูเม่ | resume_id, resume_score |
| `final_score` | คะแนนรวม | user_id, resume_id, resume_score, assessment_score, final_score |
| `desired_roles` | ตำแหน่งเป้าหมาย | user_id, resume_id, role_name, created_at, updated_at |
| `resume_gap_analysis` | ทักษะที่ขาด + คำแนะนำ | resume_id, missing_skills, recommendation, created_at |
| `job_description` | ประกาศงาน | employer_id, company_name, position_name, required_skills, job_type, job_description, duration, salary, contact_link |
| `software_skills` | ทักษะมาตรฐาน O*NET (นำเข้าจาก CSV) | อาชีพ ↔ ทักษะ/เครื่องมือ |

---

## 7. สิ่งที่ยังไม่มีในวันนั้น (เพิ่มหลังสอบ)

- careerMatches 1–4 อาชีพ (รวม 100%) และการเรียงทักษะที่ขาดตามความนิยม
- semantic skill matching (trigram + LLM ตัดสิน + cache)
- ระบบบริษัท (`companies`), สถานะงาน DRAFT/OPEN/CLOSED + วันเปิด/ปิด
- ขั้นตอนอนุมัติผู้ประกอบการ (PENDING → อนุมัติ/ปฏิเสธ)
- บันทึกการฝึกงาน (`internship_records`)
- นำเข้าข้อมูล CSV/XLSX
- เครดิตรายเดือน + การนับ token / ต้นทุนต่อการใช้งาน
- PDPA: consent, ส่งออกข้อมูล, ลบบัญชี, หน้า privacy-policy / terms
- แบ่งหน้า, rate limit, งานแบบ async
- ผลการประเมินย้อนหลัง, หน้า settings / companies / assessment-history
- รูปแบบ error มาตรฐาน `{status, message, code}`
