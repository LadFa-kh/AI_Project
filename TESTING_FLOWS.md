# TESTING_FLOWS: ทดสอบฟีเจอร์ B1–B10 ทีละ Flow

เอกสารนี้ใช้ทดสอบว่า backend ทำงานถูกต้องครบทุกฟีเจอร์ ทั้งตัว backend developer และทีมหน้าบ้านใช้ได้
ตัวอย่าง request/response ของทุก endpoint อยู่ใน `API_CHANGES.md` หัวข้อ 5

**ทดสอบทั้งหมดผ่าน Console ของเบราว์เซอร์บนหน้าเว็บ** ไม่ต้องใช้ Swagger ไม่ต้องใช้ Postman
เพราะหน้าเว็บส่งต่อคำขอ `/api/*` ไปยัง backend ให้เองอยู่แล้ว cookie จึงถูกแนบไปอัตโนมัติ และทุกอย่างใช้ฐานข้อมูลเดียวกันกับที่หน้าเว็บใช้

---

## ขั้นที่ 0: เตรียมตัว (ทำครั้งเดียว)

1. เปิดหน้าเว็บ เช่น `http://localhost:3000` (ระบบใน Docker) แล้วกด **F12** ไปที่แท็บ **Console**
2. ครั้งแรก Chrome จะไม่ให้วางโค้ด ให้พิมพ์ `allow pasting` ด้วยมือแล้วกด Enter
3. วางตัวช่วยนี้แล้วกด Enter ทุกขั้นตอนหลังจากนี้จะเรียกผ่าน `api(...)`

```js
window.api = async (method, path, body) => {
  const r = await fetch('/api/v1' + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  let data; try { data = await r.json(); } catch { data = '(ไม่มี body)'; }
  console.log(method, path, '→', r.status, data);
  return data;
};
```

> - ทุกบรรทัดที่ขึ้นต้นด้วย `await` ให้วางทีละบรรทัดแล้วกด Enter
> - สลับบัญชี = เรียก `/auth/login` ด้วยบัญชีใหม่ (cookie จะถูกแทนที่)
> - login ได้ไม่เกิน 10 ครั้ง/นาที ถ้าได้ 429 `RATE_LIMITED` ให้รอ 1 นาที

### บัญชีที่ต้องใช้ 3 บัญชี

| บัญชี | ได้มาอย่างไร |
|---|---|
| ADMIN | บัญชีแอดมินที่มีอยู่แล้ว (ถ้ายังไม่มี ดูวิธีสร้างท้ายเอกสาร) |
| STUDENT | สมัครใหม่ใน Flow 1 |
| EMPLOYER | สมัครใหม่ใน Flow 2 |

เช็กว่าตอนนี้ล็อกอินเป็นใคร:
```js
await api('GET', '/auth/me')
```
ดูที่ `data.role` ถ้าได้ 401 แปลว่ายังไม่ได้ล็อกอิน

> ถ้าใช้บัญชีทดสอบซ้ำแล้วได้ 409 `EMAIL_TAKEN` / `TELEPHONE_TAKEN` ให้เปลี่ยนเลขท้ายอีเมลและเบอร์โทร เช่น `stu2@test.com`, `0822222223`

---

## Flow 1: นักศึกษา (B9, B8, B1, B2, B6)

**1.1 ดูนโยบายปัจจุบัน** (ไม่ต้องล็อกอิน)
```js
await api('GET', '/policies/current')
```
✅ ต้องได้ `data.version` = `"1.0"`

**1.2 สมัครนักศึกษาพร้อมยอมรับนโยบาย**
```js
await api('POST', '/auth/register', { email: 'stu1@test.com', password: '123456', fullname: 'นักศึกษา ทดสอบ', telephone: '0822222222', acceptedPolicyVersion: '1.0' })
```
✅ ได้ 201, `data.role` = `STUDENT`, `data.accountStatus` = `ACTIVE`, `data.needsConsent` = `false` (ได้ cookie ใช้งานต่อได้ทันที)

**1.3 เช็กเครดิต**
```js
await api('GET', '/users/me/credits')
```
✅ ได้ `monthlyLimit: 30`, `used: 0`, `remaining: 30`

**1.4 อัปโหลดเรซูเม่และทำแบบประเมินผ่านหน้าเว็บตามปกติ** โดย **ไม่กรอกตำแหน่งงาน**
ก่อนกดส่ง ให้เปิดแท็บ Network ติ๊ก **Preserve log** แล้วกดปุ่ม **Fetch/XHR**
หลังส่ง ให้คลิกรายการ `submit` แล้วดูในแท็บ **Response**
✅ ต้องมี `careerMatches` 1–4 รายการ ค่า `percent` รวมกันได้ 100 พอดี (B1)
✅ `scoreBreakdown.matchMethod` = `"SEMANTIC"` และใน `matchDetails` มีบางแถวที่ `method` เป็น `"SEMANTIC"` (B2)

**1.5 เครดิตต้องลดลง**
```js
await api('GET', '/users/me/credits')
```
✅ `used` = `2` (อัปโหลดเรซูเม่ 1 + ส่งแบบประเมิน 1)

**1.6 บันทึกประวัติฝึกงาน (B6)**
```js
const intern = await api('POST', '/internships/me', { companyName: 'บริษัท ทดสอบ จำกัด', positionName: 'Backend Intern', startDate: '2026-10-01', endDate: '2027-01-31' })
await api('GET', '/internships/me')
```
✅ ได้ 201, `data.status` = `APPLIED` และรายการนี้แสดงใน GET

**1.7 ยกเลิก แล้วลบ**
```js
await api('PUT', '/internships/me/' + intern.data.id, { status: 'CANCELLED' })
await api('DELETE', '/internships/me/' + intern.data.id)
```
✅ ได้ 200 ทั้งสองคำขอ

**1.8 ดาวน์โหลดข้อมูลของตัวเอง (B9)**
```js
await api('GET', '/users/me/data-export')
```
✅ ต้องมี `profile`, `resumes`, `consents`, `usage`

**1.9 ถอนความยินยอม แล้วยอมรับใหม่ (B9)**
```js
await api('DELETE', '/users/me/consents')
await api('GET', '/auth/me')
await api('POST', '/users/me/consents', { version: '1.0' })
```
✅ หลังถอน `/auth/me` ต้องได้ `needsConsent: true` และหลังยอมรับใหม่ต้องได้ `needsConsent: false`

---

## Flow 2: สมัครเป็นผู้ประกาศงาน (B5)

**2.1 สมัคร**
```js
await api('POST', '/auth/register', { email: 'emp2@test.com', password: '123456', fullname: 'ผู้ประกาศ ทดสอบ', telephone: '0833333333', role: 'EMPLOYER', companyName: 'บริษัท ทดสอบสอง จำกัด', companyTaxId: '0105555022222' })
```
✅ ได้ 201, `code` = `EMPLOYER_PENDING`, `data.accessToken` = `null`

**2.2 ลองล็อกอินระหว่างรออนุมัติ**
```js
await api('POST', '/auth/login', { email: 'emp2@test.com', password: '123456' })
```
✅ ต้องได้ **403** `EMPLOYER_PENDING` (ถูกต้องตามที่ออกแบบ)

**2.3 ห้ามสมัครเป็น ADMIN**
```js
await api('POST', '/auth/register', { email: 'hack@test.com', password: '123456', fullname: 'x', role: 'ADMIN' })
```
✅ ต้องได้ 403 `ROLE_NOT_ALLOWED`

---

## Flow 3: แอดมิน (B5, B4, B7, B8, B6)

**3.1 ล็อกอินเป็นแอดมิน**
```js
await api('POST', '/auth/login', { email: 'อีเมลแอดมิน', password: 'รหัสผ่านแอดมิน' })
```
✅ `data.role` = `ADMIN` (ถ้าได้ 403 เปล่า ๆ ในขั้นถัดไป แปลว่าบัญชีนี้ไม่ใช่ ADMIN)

**3.2 ดูผู้ประกาศงานที่รออนุมัติ แล้วอนุมัติ**
```js
const pending = await api('GET', '/admin/employers?status=PENDING')
const empId = pending.data.find(e => e.email === 'emp2@test.com').userId
await api('POST', '/admin/employers/' + empId + '/approve')
```
✅ ได้ `accountStatus` = `ACTIVE` และ `companyStatus` ของบริษัทเปลี่ยนเป็น `ACTIVE`

(ทดสอบการปฏิเสธ: `await api('POST', '/admin/employers/<userId>/reject', { reason: 'ข้อมูลไม่ครบ' })` แล้วบัญชีนั้นล็อกอินต้องได้ 403 `EMPLOYER_REJECTED`)

**3.3 นำเข้าบริษัทจากไฟล์ (B7)** ใช้ไฟล์ CSV ที่สร้างจากข้อความตรงนี้เลย ไม่ต้องเปิด Excel
```js
const csv = 'name_th,name_en,tax_id,industry,province\nบริษัท นำเข้าหนึ่ง จำกัด,Import One,0105555099991,Software,ขอนแก่น\nบริษัท นำเข้าสอง จำกัด,,,Consulting,กรุงเทพมหานคร\nบริษัท เลขผิด จำกัด,,12AB,IT,ขอนแก่น';
const upload = async (dry) => { const fd = new FormData(); fd.append('file', new File([csv], 'test.csv', { type: 'text/csv' })); const r = await fetch('/api/v1/admin/companies/import?dryRun=' + dry, { method: 'POST', body: fd }); const j = await r.json(); console.log(r.status, j); return j; };
await upload(true)
```
✅ `dryRun: true`, `created: 2`, `skipped: 1`, `errors` มีแถว 4 `tax_id` "ต้องเป็นตัวเลข 10–13 หลัก"
```js
await upload(false)
await api('GET', '/admin/companies?q=นำเข้า')
await api('GET', '/admin/imports')
```
✅ บริษัท 2 แห่งถูกบันทึกจริง และมีประวัติการนำเข้า 2 รายการ (dryRun และรอบจริง)
✅ ถ้าอัปโหลดซ้ำด้วย `dryRun=false` อีกครั้ง ต้องได้ `created: 0, updated: 2` (upsert ไม่สร้างซ้ำ)

ดาวน์โหลด template ด้วยการเปิด `/api/v1/admin/companies/import/template` ในแท็บใหม่
(ถ้าเปิดใน Excel แล้วภาษาไทยเพี้ยน ไฟล์ไม่ได้เสีย แต่ถ้าจะแก้ต้อง Save เป็น "CSV UTF-8")

**3.4 จัดการบริษัท (B4)**
```js
const comps = await api('GET', '/admin/companies?q=นำเข้าหนึ่ง')
const cid = comps.data.content[0].id
await api('PATCH', '/admin/companies/' + cid + '/status', { status: 'SUSPENDED', reason: 'ทดสอบ' })
await api('GET', '/companies/' + cid)
await api('PATCH', '/admin/companies/' + cid + '/status', { status: 'ACTIVE' })
```
✅ ระหว่าง SUSPENDED หน้าสาธารณะ `/companies/{id}` ต้องได้ 404 และหลังคืนเป็น ACTIVE ต้องได้ 200

**3.5 รายงานการใช้งาน (B8)**
```js
await api('GET', '/admin/usage/summary')
await api('GET', '/admin/usage?action=ASSESSMENT_SUBMIT')
```
✅ เห็นการใช้งานจาก Flow 1

**3.6 ประวัติฝึกงานทั้งระบบ (B6)**
```js
await api('GET', '/admin/internships')
```

---

## Flow 4: ผู้ประกาศงานหลังได้รับอนุมัติ (B4, B3, B6)

**4.1 ล็อกอิน**
```js
await api('POST', '/auth/login', { email: 'emp2@test.com', password: '123456' })
```
✅ ได้ 200 แล้ว (ก่อนอนุมัติได้ 403)

**4.2 ดูและแก้ข้อมูลบริษัทของตัวเอง**
```js
await api('GET', '/companies/me')
await api('PUT', '/companies/me', { industry: 'Software', province: 'ขอนแก่น', website: 'https://example.co.th', description: 'บริษัทพัฒนาซอฟต์แวร์' })
```
✅ ได้ข้อมูลตามที่แก้ไป

**4.3 ลงประกาศที่เปิดในอนาคต (จะเป็น DRAFT)**
```js
const job = await api('POST', '/employer/jobs', { positionName: 'Backend Intern (ทดสอบ)', jobType: 'Internship', requiredSkills: 'Python,JavaScript', jobDescription: 'ทดสอบ', openDate: '2027-01-01', closeDate: '2027-02-28' })
```
✅ `status` = `DRAFT` และ `companyId` เป็นบริษัทของตัวเอง
(ถ้าได้ 400 เรื่อง skill แปลว่าชื่อทักษะใน `requiredSkills` ไม่อยู่ในระบบ ให้เปลี่ยนเป็นชื่อที่เลือกได้ในหน้าลงประกาศ)

**4.4 เปิดประกาศทันที แล้วปิด (B3)**
```js
const jobId = job.data?.id ?? job.id
await api('PATCH', '/jobs/' + jobId + '/status', { status: 'OPEN', openDate: '2026-09-01' })
await api('GET', '/workplaces/' + jobId)
await api('PATCH', '/jobs/' + jobId + '/status', { status: 'CLOSED' })
```
✅ ตอน OPEN ต้องเห็นงานในหน้ารายการงาน และตอน CLOSED งานต้องหายจากหน้ารายการงานของนักศึกษา
✅ `await api('GET', '/workplaces?status=ALL')` ในบัญชี employer ยังเห็นงานที่ CLOSED

**4.5 แก้ประกาศของคนอื่นไม่ได้**
```js
const others = await api('GET', '/workplaces')
const otherJob = others.find(j => j.companyId !== job.companyId)
await api('PATCH', '/jobs/' + otherJob.id + '/status', { status: 'CLOSED' })
```
✅ ต้องได้ 403 `NOT_JOB_OWNER` (และงานนั้นต้องยัง OPEN อยู่)
✅ ถ้าส่ง id ที่ไม่ใช่ UUID เช่น `/jobs/abc/status` ต้องได้ 400 `INVALID_PARAMETER` ไม่ใช่ 500

**4.6 ดูผู้ฝึกงานของบริษัท (B6)**
```js
await api('GET', '/employer/internships')
```
✅ ได้ list กลับมา (อาจว่าง ถ้ายังไม่มีนักศึกษาคนไหนบันทึกด้วย `companyId` หรือ `jobId` ของบริษัทนี้)

---

## Flow 5: สาธารณะ ไม่ต้องล็อกอิน (B3, B4)

ออกจากระบบก่อน: `await api('POST', '/auth/logout')`
```js
const jobs = await api('GET', '/workplaces')
await api('GET', '/companies/' + jobs[0].companyId)
await api('GET', '/companies/' + jobs[0].companyId + '/jobs')
await api('GET', '/workplaces?page=0&size=5')
```
✅ งานทุกตัวต้องมี `status: "OPEN"` และ `companyId`, หน้าบริษัทต้องไม่มี `taxId`, และแบบแบ่งหน้าต้องได้ `{content, totalElements, ...}`

---

## Flow 6: ลบบัญชี (B9) — ใช้บัญชีทดสอบเท่านั้น ลบแล้วกู้คืนไม่ได้

```js
await api('POST', '/auth/login', { email: 'stu1@test.com', password: '123456' })
await api('DELETE', '/users/me', { password: '123456' })
await api('POST', '/auth/login', { email: 'stu1@test.com', password: '123456' })
```
✅ ลบได้ 200 แล้ว login ซ้ำต้องได้ 400 (ไม่พบบัญชี)
✅ ถ้าส่งรหัสผิด ต้องได้ 400 `CONFIRMATION_FAILED` และบัญชีต้องไม่ถูกลบ

---

## ภาคผนวก: สร้างบัญชี ADMIN (ถ้ายังไม่มี)

1. สมัครบัญชีปกติ (นักศึกษา) ด้วยอีเมลที่จะใช้เป็นแอดมิน
2. ใน PowerShell ที่โฟลเดอร์โปรเจกต์ (สำหรับระบบใน Docker) รันคำสั่งนี้ แทนที่อีเมลด้วยของจริง

```powershell
"UPDATE users SET role='ADMIN' WHERE email='admin@test.com';" | docker compose exec -T postgres sh -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB'
```
✅ ต้องขึ้น `UPDATE 1` แล้วให้ login ใหม่

## ภาคผนวก: สิ่งที่ข้ามได้
- `POST /assessments/submit?async=true` + `GET /tasks/{id}` (B10) หน้าบ้านยังไม่ได้ใช้
- Rate limit: ถ้าอยากเห็น ให้เรียก `/auth/login` รัว ๆ 11 ครั้งในนาทีเดียว ครั้งที่ 11 ต้องได้ 429 `RATE_LIMITED`
