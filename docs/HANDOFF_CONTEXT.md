# HANDOFF_CONTEXT: ResuMate backend (สำหรับเริ่มแชทใหม่)

> ถ้าเริ่มแชทใหม่ ให้วางไฟล์นี้ทั้งไฟล์เป็นข้อความแรก
> อัปเดตล่าสุด: 24 ก.ย. 2569

## 1. ผู้ใช้และบทบาท
- Axz (Ratchapon Srichamnan) นักศึกษาวิศวกรรมคอมพิวเตอร์ มทร.อีสาน ขอนแก่น เป็น **backend developer คนเดียว** ของโครงงาน ECP-P01 ResuMate (ทีม 2 คน)
- เพื่อนร่วมทีมทำ frontend (Next.js) เอง และสื่อสารกับ backend ผ่าน `API_CHANGES.md` / `FRONTEND_REQUESTS.md`
- วิธีทำงานที่ต้องการ:
  - ให้ Claude เขียนโค้ดและคอมไพล์ให้ผ่าน ส่วนผู้ใช้เป็นคน build, test และ push เอง
  - คุยภาษาไทยแบบกันเอง อธิบายทีละเรื่องแบบง่าย ๆ อย่าอัดหลายเรื่องในทีเดียว
  - ทุกขั้นตอนต้องมีคำสั่งหรือ body ที่ก๊อปไปวางได้ทันที อย่าให้ผู้ใช้ต้องเดาค่าเอง

## 2. โครงสร้างระบบ
- โปรเจกต์อยู่ที่ `C:\Users\ratch\IdeaProjects\AI_Project` (GitHub: LadFa-kh/AI_Project, branch `main`)
- `backend/`: Spring Boot 3.3.2 / Java 21 / JPA `ddl-auto=update` / PostgreSQL 16
- `main.py`: FastAPI (service ชื่อ `resume-service`) เรียก Gemini `gemini-3.1-flash-lite-preview` ผ่าน CometAPI
- `frontend/`: Next.js ส่งต่อคำขอ `/api/*` ไป `http://backend:8080` (Next rewrite มี timeout 30 วินาที)
- **Production อยู่บนเครื่องของผู้ใช้เอง** ใช้ Docker Compose ร่วมกับ Cloudflare Tunnel (`.env` มี `COMPOSE_FILE=docker-compose.yml;docker-compose.tunnel.yml`)
  - เว็บจริงคือ `https://app.recommendation.site` ส่วน `localhost:3000` คือระบบเดียวกัน
  - ทุกครั้งที่สั่ง `docker compose up --build` คือ **deploy ขึ้น production ทันที**
  - postgres ไม่เปิด port ออกนอก container (pgAdmin จึงต่อไม่ได้) ต้องใช้ `docker compose exec postgres ...`
  - IntelliJ run (port 9090) เป็นตัวพัฒนา ใช้ DB แยกต่างหาก
- **Dockerfile ของ backend ก๊อป `target/*.jar` ที่ build ไว้แล้ว** ไม่ได้ build ใน Docker (ขั้น Maven ใน Docker ค้าง) จึงต้องรัน:
  ```powershell
  cd backend; mvn clean package -DskipTests; cd ..
  docker compose up -d --build --no-deps backend          # แก้ main.py ต้องเพิ่ม resume-service
  docker compose logs -f backend
  ```
- คำสั่ง SQL บน production (PowerShell) มี 2 แบบ
  - ถ้า SQL มีภาษาไทย ห้าม pipe เพราะตัวอักษรไทยจะเพี้ยน ให้ `docker compose cp file.sql postgres:/tmp/x.sql` แล้วรันด้วย `-f`
  - ถ้าเป็น SQL สั้น ๆ ภาษาอังกฤษ ใช้แบบนี้ได้
    ```powershell
    "SQL;" | docker compose exec -T postgres sh -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB'
    ```

## 3. สิ่งที่ทำเสร็จแล้ว (B1–B11 + รอบตอบ FE) ขึ้น production และทดสอบแล้ว
| ข้อ | เรื่อง | ไฟล์หลัก |
|---|---|---|
| B1 | `careerMatches` 1–4 อาชีพ รวม 100% (largest remainder, น้ำหนักเป็นคะแนนยกกำลังสอง), `missingSkills` เรียงตามความนิยม hot technology สาย IT, `roleNameTh` | `AssessmentService`, `CareerMatchCalculator` (+test) |
| B2 | semantic matching: จับคู่ด้วยคำก่อน → คัดคู่ด้วย trigram → cache → LLM ตัดสิน (prompt เข้มงวด) → fallback, `matchDetails` | `SemanticSkillMatcher`, `skill_match_cache`, `/python/judge-skill-matches` |
| B3 | DRAFT/OPEN/CLOSED + วันเปิด/ปิด + ตัวตั้งเวลา + `PATCH /jobs/{id}/status` | `JobDescriptionService`, `JobStatusScheduler` |
| B4 | `companies` + ย้ายข้อมูลเก่า + `/companies/**` + `/admin/companies/**` | `CompanyService`, `CompanyDataMigration` |
| B5 | สมัคร EMPLOYER → PENDING → อนุมัติ/ปฏิเสธ, `AccountGuard` | `RegistrationService`, `AdminEmployerController` |
| B6 | `internship_records` | `internship/` |
| B7 | นำเข้า CSV/XLSX (parser เขียนเอง) + dryRun + upsert + `import_logs` | `importer/` |
| B8 | `usage_logs` + เครดิต 30/เดือน + 429 `CREDITS_EXHAUSTED` + **นับ token (cost per action)** | `UsageService`, `TokenMeter`, `/admin/usage/cost` |
| B9 | consent, `/policies/current`, `needsConsent`, data-export, `DELETE /users/me`, retention | `user/consent/`, `user/account/` |
| B10 | แบ่งหน้า, index, cache, async `/tasks`, rate limit (in-memory) | `platform/` |
| B11 | `backend/README.md` | |
| FE | `requiredSkillsDetail` บนการ์ดงาน (เมื่อล็อกอิน), ยืนยันรูปแบบ response | `JobSkillAnnotator` |

- error ทุกตัวมีรูปแบบ `{status, message, code}` (ผ่าน `BusinessException` / `GlobalExceptionHandler`) id ที่ผิดรูปแบบได้ 400 `INVALID_PARAMETER`
- ฟิลด์ใหม่ทุกตัวไม่บังคับ (NON_NULL) หน้าบ้านเดิมจึงไม่พัง

## 4. เอกสารในโปรเจกต์
- `API_CHANGES.md` หัวข้อ 5 เป็นสัญญา API กับหน้าบ้าน (5.13 = คำตอบต่อ FRONTEND_REQUESTS)
- `TESTING_FLOWS.md` ทดสอบผ่าน Console ของเบราว์เซอร์ด้วย helper `api()` (ต้องพิมพ์ `allow pasting` ก่อน)
- `backend/README.md` สถาปัตยกรรม, ER, config, endpoint ทั้งหมด
- `docs/PRIVACY_POLICY_TH.md` **ร่าง**นโยบาย PDPA (ต้องเติม [อีเมลติดต่อ] และให้เจ้าของโครงงานตรวจก่อนใช้)

## 5. ค่าที่ตั้งได้ (`application.properties`)
- `app.policy.enforce-on-register=false` ให้เปลี่ยนเป็น `true` **หลังจาก FE ทำหน้า `/privacy-policy` เสร็จ**
- `app.credits.monthly-limit=30`, `app.matching.semantic.enabled=true`
- `app.llm.price.input-per-1m=0` / `output-per-1m=0` **ยังไม่ได้ใส่ราคาจริงของ CometAPI** ถ้ายังเป็น 0 ช่อง `avgCost` จะเป็น 0

## 6. งานที่ค้าง
1. ใส่ราคา LLM จริงใน `app.llm.price.*` แล้วรอให้มีการใช้งานจริงสักระยะ จากนั้นดึง `GET /api/v1/admin/usage/cost` ไปทำตาราง Cost per action ที่อาจารย์ขอ
2. FE ทำหน้า `/privacy-policy` เสร็จเมื่อไร ให้ตั้ง `enforce-on-register=true` แล้ว build backend
3. บัญชีทดสอบของ FE: ถ้าเพื่อนสมัคร `fe-admin@test.com` แล้ว ให้ตั้งเป็น ADMIN ด้วย `UPDATE users SET role='ADMIN' WHERE email='fe-admin@test.com';`
4. เมื่อทดสอบเสร็จ ให้ล้างข้อมูลทดสอบ (บัญชี `@test.com`) ออกจากฐานข้อมูลจริง
5. บทที่ 4 ของรูปเล่ม (docx): ลบคอลัมน์ "ครั้งที่" และเลขหน้าแล้ว ช่องข้อมูลนำเข้าที่ไฮไลต์สีเหลือง ผู้ใช้ยังต้องยืนยันเอง และตำแหน่ง "(ต่อ)" ต้องเช็กใน Word (ฟอนต์ TH SarabunPSK)
6. ทางเลือก (ไม่บังคับ): ลองนำเข้าไฟล์ XLSX และ async `/tasks` ซึ่งยังไม่ได้ทดสอบจริง ส่วนการ retrieval ของ B2 ถ้าจะเปลี่ยนเป็น embedding ต้องเพิ่ม library

## 7. ข้อควรระวัง
- ห้ามใส่ key หรือ token จริงลงไฟล์ในโปรเจกต์ และห้ามส่ง `.env` ให้ใคร (มี tunnel token กับ COMET_API_KEY)
- ห้าม `git push --force` และห้าม dump ทั้ง DB ออกไป (มีข้อมูลส่วนบุคคล) ถ้าจะส่งข้อมูลให้เพื่อน ส่งได้เฉพาะตาราง `software_skills`
- `SecurityConfig.java` ในเครื่องผู้ใช้มีส่วนที่ผู้ใช้แก้เองอยู่ ถ้าจะแก้ไฟล์นี้ต้องแก้เฉพาะจุด ห้ามเขียนทับทั้งไฟล์
- ไฟล์ใน `C:\Users\ratch\IdeaProjects\*.tgz` เป็นไฟล์ชั่วคราวที่ใช้ส่งโค้ด ลบทิ้งได้
- ถ้า `git` ขึ้นว่า `.git/index.lock` exists ให้ `Remove-Item .git\index.lock`
