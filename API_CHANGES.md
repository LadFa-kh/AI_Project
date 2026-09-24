# API_CHANGES — การเปลี่ยนแปลงฝั่ง Backend สำหรับทีม Frontend

เอกสารนี้สรุปสิ่งที่เปลี่ยนในฝั่งหลังบ้าน เพื่อให้ทีมหน้าบ้านรู้ว่าต้องแก้อะไรบ้าง

**สรุปสั้นที่สุด:** ไม่มี breaking change ฟิลด์เดิมทุกตัวยังอยู่ครบและความหมายไม่เปลี่ยน
มีแค่ **ฟิลด์ใหม่ 2 ตัวถูกเพิ่มเข้ามา** ถ้าไม่แก้อะไรเลยระบบก็ยังทำงานได้ตามเดิม

---

## สารบัญ

1. [ฟิลด์ใหม่ใน POST /assessments/submit](#1-ฟิลด์ใหม่ใน-post-apiv1assessmentssubmit)
2. [~~Endpoint ใหม่ GET /jobs/{id}~~ ถอนออกแล้ว](#2-endpoint-ใหม่-get-apiv1jobsid--ถอนออกแล้ว)
3. [อายุ session เปลี่ยนจาก 15 นาที เป็น 1 วัน](#3-อายุ-session-เปลี่ยนจาก-15-นาที-เป็น-1-วัน)
4. [สูตรคำนวณคะแนน สำหรับอ้างอิง](#4-สูตรคำนวณคะแนน-สำหรับอ้างอิง)
5. [รอบ B1–B11: ฟีเจอร์ใหม่ทั้งหมด + ตัวอย่าง body](#5-รอบ-b1b11-24-กย-2569)

---

## 1. ฟิลด์ใหม่ใน `POST /api/v1/assessments/submit`

### สิ่งที่เปลี่ยน

เพิ่มฟิลด์ระดับบนสุด 2 ตัว **ฟิลด์เดิมทั้ง 7 ตัวไม่ถูกแตะเลย**

| ฟิลด์ | ชนิด | สถานะ |
|---|---|---|
| `resumeId` | `string` | เดิม ไม่เปลี่ยน |
| `resumeScore` | `number` | เดิม ไม่เปลี่ยน |
| `assessmentScore` | `number` | เดิม ไม่เปลี่ยน |
| `finalScore` | `number` | เดิม ไม่เปลี่ยน |
| `missingSkills` | `string[]` | เดิม ไม่เปลี่ยน |
| `recommendationSummary` | `string` | เดิม ไม่เปลี่ยน |
| `recommendationItems` | `string[]` | เดิม ไม่เปลี่ยน |
| **`scoreBreakdown`** | `object` | **ใหม่** |
| **`scoreExplanation`** | `string` | **ใหม่** |

> **ทำไมถึงเพิ่ม:** เดิมหน้าเว็บแสดงคะแนนสามตัวโดยไม่มีที่มา ตอบไม่ได้ว่าคิดมาอย่างไร
> อาจารย์ต้องการให้แยกได้ว่าคะแนนแต่ละส่วนมาจากไหน

### ตัวอย่าง response เต็ม

```jsonc
{
  "resumeId": "3f2a...-....",
  "resumeScore": 53.00,
  "assessmentScore": 100.00,
  "finalScore": 71.80,
  "missingSkills": ["Cloud Computing (AWS/Azure/GCP)", "Unit Testing (JUnit/NUnit/TestNG)"],
  "recommendationSummary": "คุณมีทักษะการเขียนโปรแกรม...",
  "recommendationItems": ["ศึกษาเครื่องมือ CI/CD...", "ฝึกฝนการทำ Unit Testing..."],

  // ---------- ใหม่ ----------
  "scoreBreakdown": {
    // ส่วนที่ 1 คะแนนเรซูเม่
    "totalResumeSkills": 9,          // จำนวนทักษะที่สกัดได้จากเรซูเม่ (ตัวหารของ precision)
    "totalStandardSkills": 40,       // จำนวนทักษะมาตรฐาน O*NET ของตำแหน่งนี้
    "matchedSkills": ["Java", "Spring Boot", "Docker", "Git", "PostgreSQL"],
    "unmatchedSkills": ["Photoshop", "Excel", "Figma", "Canva"],
    "precisionScore": 55.56,         // (5 / 9) x 100
    "penaltyFactor": 1.00,           // ตัวคูณลงโทษ ดูตารางในหัวข้อ 4
    "resumeScore": 53.00,            // precisionScore x penaltyFactor (ไม่เกิน 100)
    "resumeScoreReason": "จับคู่ทักษะได้ 5 รายการ ตั้งแต่ 3 รายการขึ้นไปไม่มีการคูณตัวถ่วง",

    // ส่วนที่ 2 คะแนนแบบประเมินตนเอง
    "answeredQuestions": 5,
    "maxScorePerQuestion": 4,
    "totalScoreObtained": 20,
    "maxPossibleScore": 20,          // answeredQuestions x maxScorePerQuestion
    "assessmentScore": 100.00,       // (totalScoreObtained / maxPossibleScore) x 100

    // ส่วนที่ 3 การถ่วงน้ำหนักรวม
    "resumeWeight": 0.6,
    "assessmentWeight": 0.4,
    "resumeContribution": 31.80,     // resumeScore x resumeWeight
    "assessmentContribution": 40.00, // assessmentScore x assessmentWeight
    "finalScore": 71.80,             // resumeContribution + assessmentContribution

    // ข้อมูลประกอบ
    "roleUsedForMatching": "Software Developers",
    "roleInferredByAi": false        // true = ผู้ใช้ไม่ได้กรอกตำแหน่ง ระบบวิเคราะห์ให้เอง
  },

  "scoreExplanation": "คะแนนรวม 71.80 มาจากสองส่วน ส่วนแรกคือคะแนนเรซูเม่..."
}
```

### TypeScript type

```ts
export type ScoreBreakdown = {
  // ส่วนที่ 1 คะแนนเรซูเม่
  totalResumeSkills: number;
  totalStandardSkills: number;
  matchedSkills: string[];
  unmatchedSkills: string[];
  precisionScore: number;
  penaltyFactor: number;
  resumeScore: number;
  resumeScoreReason: string;

  // ส่วนที่ 2 คะแนนแบบประเมินตนเอง
  answeredQuestions: number;
  maxScorePerQuestion: number;
  totalScoreObtained: number;
  maxPossibleScore: number;
  assessmentScore: number;

  // ส่วนที่ 3 การถ่วงน้ำหนักรวม
  resumeWeight: number;
  assessmentWeight: number;
  resumeContribution: number;
  assessmentContribution: number;
  finalScore: number;

  roleUsedForMatching: string;
  roleInferredByAi: boolean;
};

export type AssessmentSubmitResult = {
  resumeId: string;
  resumeScore: number;
  assessmentScore: number;
  finalScore: number;
  missingSkills: string[];
  recommendationSummary: string;
  recommendationItems: string[];

  // ทำเป็น optional ไว้ดีกว่า เพราะผลที่บันทึกไว้ใน sessionStorage
  // ก่อนหน้านี้จะไม่มีสองฟิลด์นี้
  scoreBreakdown?: ScoreBreakdown;
  scoreExplanation?: string;
};
```

### ข้อควรระวัง 4 ข้อ

**1. อย่าคำนวณตัวเลขซ้ำในหน้าเว็บ**

ใช้ `resumeContribution` และ `assessmentContribution` ที่ส่งมาแทนการคูณเอง
ถ้าวันหนึ่งน้ำหนักเปลี่ยนจาก 60/40 หรือเพิ่มองค์ประกอบที่สาม ตัวเลขบนหน้าจอ
จะเปลี่ยนตามเองโดยไม่ต้องแก้หน้าเว็บ และไม่มีทางที่สองฝั่งจะแสดงเลขไม่ตรงกัน

```ts
// ❌ อย่าทำ
const fromResume = result.resumeScore * 0.6;

// ✅ ทำแบบนี้
const fromResume = result.scoreBreakdown.resumeContribution;
```

**2. แสดงน้ำหนักเป็นเปอร์เซ็นต์จากค่าที่ส่งมา ไม่ใช่เขียน 60% ตายตัว**

```ts
const label = `${breakdown.resumeWeight * 100}%`;
```

**3. `totalStandardSkills === 0` ต้องแสดงข้อความต่างออกไป**

กรณีนี้แปลว่า **ระบบค้นทักษะมาตรฐานของตำแหน่งนั้นไม่เจอในฐานข้อมูล O*NET
จึงเทียบให้ไม่ได้** ผลลัพธ์คือ `resumeScore = 0` เหมือนกับกรณี "ทักษะไม่ตรงเลย"
แต่ความหมายต่างกันมาก และ**ไม่ใช่ความผิดของผู้ใช้**

แนะนำให้แสดงเป็นกล่องเตือน พร้อมบอกให้ลองระบุชื่อตำแหน่งงานให้ใกล้เคียง
ชื่ออาชีพมาตรฐานมากขึ้น แทนที่จะแสดงว่าได้ 0 คะแนนเฉย ๆ

**4. `penaltyFactor < 1` ต้องอธิบายให้ผู้ใช้เข้าใจ**

ถ้าไม่อธิบาย ผู้ใช้จะกดเครื่องคิดเลขแล้วพบว่า `precisionScore` ไม่เท่ากับ
`resumeScore` แล้วคิดว่าระบบคำนวณผิด ทั้งที่เป็นการลดคะแนนโดยตั้งใจ
ใช้ข้อความจาก `resumeScoreReason` ได้เลย หรือเขียนเองก็ได้

---

## 2. ~~Endpoint ใหม่ `GET /api/v1/jobs/{id}`~~ — ถอนออกแล้ว

> **แก้ไข:** เอกสารฉบับแรกบอกว่ามี endpoint ใหม่ `GET /api/v1/jobs/{id}` — **ผิด**
> ระบบมี `GET /api/v1/workplaces/{id}` ที่ทำงานเหมือนกันทุกประการอยู่ก่อนแล้ว
> (ทั้งสองเรียก `jobDescriptionService.getJobDescriptionById` ตัวเดียวกัน)
> `GET /jobs/{id}` จึงถูกถอนออกเพื่อไม่ให้มีสองเส้นทางที่ทำงานซ้ำกัน
>
> **ใช้ `GET /api/v1/workplaces/{id}` แทน**

### ข้อมูลที่ทีมหน้าบ้านควรรู้

`GET /api/v1/workplaces` (รายการ) และ `GET /api/v1/workplaces/{id}` (รายตัว)
คืน `JobDescriptionResponseDto` แบบเดียวกัน ซึ่ง**มีฟิลด์ครบทุกตัวอยู่แล้ว**
รวมถึง `jobDescription`, `duration`, `salary`, `contactLink` ที่หน้ารายละเอียด
ฝึกงานต้องใช้ — ไม่ต้องเพิ่ม endpoint อะไรเลย

```jsonc
{
  "id": "8c1f...-....",              // ⚠️ ชื่อ id ไม่ใช่ jobId
  "companyName": "บริษัท คลาวด์เบส เทคโนโลยี จำกัด",
  "jobType": "Full-time",
  "positionName": "DevOps Engineer",
  "requiredSkills": ["Docker", "Linux", "Amazon Web Services AWS software", "Git"],
  "jobDescription": "ดูแลระบบ CI/CD และโครงสร้างพื้นฐานบนคลาวด์...",
  "duration": "สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)",
  "salary": "25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)",
  "contactLink": "https://careers.example.com/apply/cloudbase"
}
```

ต้องล็อกอินก่อน (cookie `accessToken` ต้องส่ง `credentials: "include"`)

### ข้อควรระวัง 3 ข้อ

**1. ฟิลด์ id ชื่อไม่ตรงกับ endpoint อื่น**

endpoint นี้คืน `id` แต่ `GET /matching/recommendations` คืน `jobId`
ต้อง map ให้ตรงกับ type ที่ใช้อยู่ก่อนนำไปแสดง

**2. endpoint นี้ไม่คืนคะแนนความเหมาะสม**

`userFinalScore` / `matchedSkills` / `missingSkills` เป็นข้อมูลเฉพาะบุคคล
ไม่ใช่ข้อมูลของประกาศ จึงไม่ได้อยู่ใน endpoint นี้
ถ้าต้องการแสดงคะแนนด้วย ต้องผสมกับข้อมูลจาก `sessionStorage` ของหน้ารายการ

**3. ฟิลด์ที่เป็น optional ใน DB เป็น `null` ได้**

`jobType`, `jobDescription`, `duration`, `salary`, `contactLink` ผู้ประกาศอาจไม่ได้กรอก
ต้องเช็คก่อนแสดงทุกตัว

> `contactLink` เป็น URL ที่ผู้ประกาศกรอกเอง ถ้าทำเป็นลิงก์เปิดแท็บใหม่
> อย่าลืม `rel="noopener noreferrer"` คู่กับ `target="_blank"`

---

## 3. อายุ session เปลี่ยนจาก 15 นาที เป็น 1 วัน

### สิ่งที่เปลี่ยน

cookie `accessToken` เดิมอายุ 15 นาที ทำให้ผู้ใช้หลุดออกจากระบบระหว่างใช้งานบ่อยมาก
เพราะระบบยังไม่ได้ต่อ refresh token เข้ากับ flow การล็อกอินจริง 15 นาทีจึงเป็นอายุของทั้ง session

ตอนนี้ตั้งเป็น **1 วัน** และอายุของ JWT กับ cookie ผูกกับค่าเดียวกันแล้ว จึงหมดอายุพร้อมกันเสมอ

ปรับได้ที่ `backend/src/main/resources/application.properties`

```properties
app.jwt.access-token-expiration-ms=86400000
```

### ผลกับหน้าบ้าน

**ไม่ต้องแก้โค้ดอะไร** แต่ควรรู้ไว้ 2 ข้อ

1. **token เก่าที่ค้างในเบราว์เซอร์ยังอายุ 15 นาทีอยู่** ต้องล็อกอินใหม่หนึ่งครั้งถึงจะได้ token อายุ 1 วัน
2. ถ้ามีข้อความหรือ timer ในหน้าเว็บที่อ้างถึง 15 นาที ต้องแก้ตาม

---

## 4. สูตรคำนวณคะแนน สำหรับอ้างอิง

ส่วนนี้ไม่ต้องเอาไปเขียนโค้ด แค่ใช้ทำความเข้าใจตอนออกแบบหน้าจอ

### สูตรรวม

```
finalScore = (resumeScore x 0.6) + (assessmentScore x 0.4)
```

### คะแนนแบบประเมินตนเอง (40%)

```
assessmentScore = (ผลรวมคะแนนที่ตอบ / (จำนวนข้อ x 4)) x 100
```

แต่ละข้อตอบได้ 1–4 จำนวนข้อไม่ตายตัว คิดจากจำนวนข้อที่ส่งมาจริง

### คะแนนเรซูเม่ (60%) — มีสองขั้น

**ขั้นแรก precision**

```
precisionScore = (จำนวนทักษะที่จับคู่ได้ / จำนวนทักษะทั้งหมดในเรซูเม่) x 100
```

ตัวหารคือ **ทักษะที่สกัดจากเรซูเม่** ไม่ใช่ทักษะที่ตำแหน่งงานต้องการ
ยิ่งใส่ทักษะเยอะแต่ไม่ตรงสาย คะแนนยิ่งลดลง

**ขั้นสอง ตัวคูณลงโทษ**

| จับคู่ได้ | ตัวคูณ |
|---|---|
| 0 รายการ | 0.0 |
| 1 รายการ | 0.3 |
| 2 รายการ | 0.6 |
| ตั้งแต่ 3 รายการ | 1.0 |

```
resumeScore = min(100, precisionScore x penaltyFactor)
```

เจตนาคือกันเคสที่เรซูเม่มีทักษะเดียวแล้วบังเอิญตรง จะได้ 100 เต็มทันทีทั้งที่ไม่ควร

**ตัวอย่าง** เรซูเม่มี 10 ทักษะ ตรง 2 รายการ

```
(2 / 10) x 100 = 20    แล้ว    20 x 0.6 = 12
```

ได้ 12 ไม่ใช่ 20

### ทักษะมาตรฐานมาจากไหน

1. เอาชื่อตำแหน่งงาน (ผู้ใช้กรอก หรือ AI วิเคราะห์จากทักษะถ้าไม่ได้กรอก) แปลเป็นอังกฤษ
2. ตัดเป็นคำ กรอง stop word และคำสั้นกว่า 3 ตัวอักษร
3. ค้นตาราง `software_skills` (นำเข้าจาก O*NET) ด้วยแต่ละคำ
4. รวมผลเป็น set ไม่ซ้ำ

การจับคู่ใช้ word boundary **สองทาง** หลัง normalize ไม่ใช่ exact match

### เรื่องที่ควรรู้

**คะแนนคำนวณครั้งเดียวตอนส่งแบบประเมิน** แล้วเก็บลงตาราง `final_score`
ถ้าเรซูเม่หรือทักษะเปลี่ยนทีหลัง คะแนนเดิมไม่อัปเดตตาม

**ตัวเลขทุกค่าคำนวณจากฝั่ง Java ทั้งหมด** ปัญญาประดิษฐ์ไม่ได้คำนวณเอง
มีหน้าที่แค่เรียบเรียง `scoreExplanation` จากตัวเลขที่ส่งไปให้เท่านั้น
ตัวเลขใน `scoreExplanation` จึงตรงกับ `scoreBreakdown` เสมอ

---

## สรุปสิ่งที่ต้องทำฝั่งหน้าบ้าน

| งาน | จำเป็นไหม |
|---|---|
| เพิ่ม type `ScoreBreakdown` และฟิลด์ optional 2 ตัวใน `AssessmentSubmitResult` | ต้องทำ ถ้าจะใช้ |
| ทำ UI แสดงที่มาของคะแนน | ต้องทำ ถ้าจะใช้ |
| ใช้ `GET /workplaces/{id}` ในหน้ารายละเอียดฝึกงาน (มีอยู่แล้ว ไม่ใช่ของใหม่) | ต้องทำ ถ้าจะใช้ |
| แก้ข้อความที่อ้างถึง session 15 นาที | ทำถ้ามี |
| แก้โค้ดเดิมที่ใช้อยู่ | **ไม่ต้อง** ฟิลด์เดิมไม่เปลี่ยน |

ถ้าไม่แก้อะไรเลย ระบบยังทำงานได้ตามเดิมทุกอย่าง

---

## ภาคผนวก — สคริปต์ดึงงานจาก GitHub มา build

ที่ root ของโปรเจกต์มีไฟล์ `sync-fe.ps1` ไว้ใช้แทนการพิมพ์คำสั่งทีละบรรทัด

```powershell
cd C:\Users\ratch\IdeaProjects\AI_Project
.\sync-fe.ps1
```

สคริปต์จะทำให้ตามลำดับ

1. ตรวจว่ามีงานค้างที่ยังไม่ commit ไหม ถ้ามีจะหยุดทันที (กัน merge ทับงานหาย)
2. `git fetch` แล้วบอกว่ามี commit ใหม่กี่อัน
3. ดูว่าแตะ backend / frontend / main.py ส่วนไหนบ้าง
4. merge ด้วย `-Xrenormalize -Xignore-all-space` เพื่อข้าม conflict ปลอมจาก line ending
5. `docker compose up -d --build` **เฉพาะ service ที่โดนแก้จริง** ไม่ build ทั้งหมด

ถ้าเจอ conflict จริงจะหยุดพร้อมบอกชื่อไฟล์ ไม่ merge ต่อเอง

ไม่อยาก build ต่อ ใส่ `-NoBuild`

```powershell
.\sync-fe.ps1 -NoBuild
```

> **ข้อควรรู้:** ตัวเลือก `-Xrenormalize -Xignore-all-space` ยังจำเป็นอยู่จนกว่า
> ทีมหน้าบ้านจะ pull commit `.gitattributes` ของเราไป หลังจากนั้นทั้งสองฝั่งจะ
> เก็บ line ending เป็น LF เหมือนกัน แล้ว conflict ปลอมจะหายไปเอง

---

## 5. รอบ B1–B11 (24 ก.ย. 2569)

> **ไม่มี breaking change** — ฟิลด์เดิมทุกตัวอยู่ครบ ฟิลด์ใหม่ทุกตัวเป็น optional (ถ้าไม่มีค่า จะไม่ปรากฏใน JSON)
> หน้าเว็บที่ deploy อยู่ใช้ต่อได้ทันทีโดยไม่ต้องแก้อะไร หัวข้อนี้คือ "ของใหม่ที่หน้าบ้านเอาไปทำหน้าจอได้"
> ตัวอย่าง body ทุกอันก๊อปไปใช้ได้เลย — **อย่าใช้ค่าที่ Swagger เติมให้อัตโนมัติ** เพราะมันใส่ฟิลด์ที่ระบบสร้างเองมาด้วย

### 5.0 รูปแบบ error ใหม่ (ทุก endpoint)

```json
{ "status": 403, "message": "บัญชีผู้ประกาศงานของคุณกำลังรอผู้ดูแลระบบอนุมัติ", "code": "EMPLOYER_PENDING" }
```

ให้ตัดสินใจจาก `code` ไม่ใช่ `message` (message เปลี่ยนคำได้ code ไม่เปลี่ยน) — code ที่หน้าบ้านควรรู้จัก:

| code | status | ความหมาย / หน้าบ้านควรทำอะไร |
|---|---|---|
| `EMPLOYER_PENDING` | 201 / 403 | ผู้ประกาศงานรออนุมัติ → แสดงหน้า "รออนุมัติ" |
| `EMPLOYER_REJECTED` / `ACCOUNT_SUSPENDED` | 403 | บัญชีถูกปฏิเสธ/ระงับ → แสดง message |
| `ROLE_NOT_ALLOWED` | 403 | พยายามสมัครเป็น ADMIN |
| `EMAIL_TAKEN` / `TELEPHONE_TAKEN` | 409 | อีเมล/เบอร์ซ้ำ → แสดงใต้ช่องกรอก |
| `CREDITS_EXHAUSTED` | 429 | เครดิตเดือนนี้หมด |
| `RATE_LIMITED` | 429 | ส่งถี่เกินไป → รอตาม header `Retry-After` (วินาที) |
| `CONSENT_REQUIRED` | 400 | (เมื่อเปิดบังคับ) สมัครโดยไม่ยอมรับนโยบาย |
| `VALIDATION_ERROR` / `BAD_REQUEST` | 400 | ข้อมูลไม่ถูกต้อง |
| `DATA_CONFLICT` | 409 | ข้อมูลซ้ำในฐานข้อมูล |

---

### 5.1 B1 — อาชีพที่เหมาะ (`careerMatches`)

**Endpoint เดิม** `POST /api/v1/assessments/submit` — มีฟิลด์ใหม่ `careerMatches` **เฉพาะตอนผู้ใช้ไม่ได้กรอก `desiredRoleName`**
(กรอกตำแหน่งมา = ไม่มีฟิลด์นี้ ให้ซ่อนส่วนนี้ไป)

```json
"careerMatches": [
  {
    "roleName": "Software Developers, Applications",
    "percent": 32,
    "matchedSkills": ["Java", "Python", "Spring Boot", "PostgreSQL", "Docker"],
    "missingSkills": ["Amazon Web Services AWS software", "Kubernetes", "Linux", "Microsoft Azure software"]
  },
  { "roleName": "Web Developers", "percent": 26, "matchedSkills": ["..."], "missingSkills": ["..."] },
  { "roleName": "Database Administrators", "percent": 22, "matchedSkills": ["..."], "missingSkills": ["Linux", "UNIX", "Microsoft SQL Server"] }
]
```

- มี 1–4 รายการ เรียงจาก % มากไปน้อย, `percent` เป็นจำนวนเต็ม **รวมกันได้ 100 เสมอ**
- `missingSkills` ของแต่ละอาชีพมีไม่เกิน 10 รายการ เรียงจากที่ตลาดใช้กว้างที่สุดก่อน
- **แนะนำ UI:** กราฟแท่งแนวนอนหรือโดนัท + กดแต่ละอาชีพเพื่อดูทักษะที่มี/ที่ขาด

### 5.2 B2 — ที่มาของการจับคู่ทักษะ (`scoreBreakdown.matchDetails`)

```json
"scoreBreakdown": {
  "...ฟิลด์เดิม...": "...",
  "matchMethod": "SEMANTIC",
  "matchDetails": [
    { "resumeSkill": "PostgreSQL",      "standardSkill": "PostgreSQL",          "method": "WORD",     "confidence": 1.0 },
    { "resumeSkill": "Spring Data JPA", "standardSkill": "Spring Framework",    "method": "SEMANTIC", "confidence": 1.0 },
    { "resumeSkill": "Caddy",           "standardSkill": null,                  "method": "NONE",     "confidence": null }
  ]
}
```

- `method`: `WORD` = ชื่อตรงกัน, `SEMANTIC` = AI ตัดสินว่าความหมายตรงกัน, `NONE` = ไม่ตรง
- `matchMethod`: `SEMANTIC` ปกติ / `WORD_FALLBACK` = AI ใช้ไม่ได้รอบนั้น ระบบใช้แบบคำอย่างเดียว
- **แนะนำ UI:** ในตารางทักษะที่ตรง ใส่ป้ายเล็ก ๆ "AI" ให้แถวที่เป็น SEMANTIC พร้อม tooltip "ตรงกับ {standardSkill}"

---

### 5.3 B3 — สถานะประกาศงาน

ประกาศงานมีฟิลด์ใหม่ (ทั้งใน `/workplaces`, `/workplaces/{id}`, `/employer/jobs`):

```json
{ "id": "...", "companyName": "...", "status": "OPEN", "openDate": "2026-10-01", "closeDate": "2026-11-30" }
```

- `status`: `DRAFT` (ยังไม่เปิด) / `OPEN` / `CLOSED` — `openDate`/`closeDate` ไม่มีค่า = ไม่ปรากฏ
- `GET /api/v1/workplaces` คนทั่วไปเห็นเฉพาะ OPEN (**เหมือนเดิมทุกอย่าง**) — EMPLOYER/ADMIN ใส่ `?status=ALL` เพื่อเห็นทั้งหมด
- ระบบเปิด/ปิดประกาศตามวันที่ให้อัตโนมัติทุกชั่วโมง

**เปิด/ปิดประกาศ** (เจ้าของประกาศ หรือ ADMIN):
```
PATCH /api/v1/jobs/{jobId}/status
```
```json
{ "status": "CLOSED" }
```
หรือตั้งช่วงรับสมัคร:
```json
{ "status": "OPEN", "openDate": "2026-10-01", "closeDate": "2026-11-30" }
```

**ลงประกาศพร้อมวันที่** — `POST /api/v1/employer/jobs` (body เดิม + ฟิลด์ใหม่ไม่บังคับ):
```json
{ "positionName": "Backend Intern", "jobType": "Internship", "requiredSkills": "Java,Spring Boot",
  "jobDescription": "...", "openDate": "2026-10-01", "closeDate": "2026-11-30" }
```
ถ้า `openDate` อยู่ในอนาคต ประกาศจะเป็น DRAFT แล้วเปิดเองเมื่อถึงวัน

**แบ่งหน้า (ไม่บังคับ):** `GET /api/v1/workplaces?page=0&size=20&q=backend` → ได้ `{content:[...], page, size, totalElements, totalPages}` (ไม่ส่ง `page` = ได้ array แบบเดิม)

---

### 5.4 B4 — บริษัท

ประกาศงานมีฟิลด์ใหม่ `companyId`, `companyLogoUrl`, `postedBy` → ใช้ทำลิงก์ไปหน้าบริษัท

| method | path | ใคร |
|---|---|---|
| GET | `/api/v1/companies/{companyId}` | ทุกคน (ไม่ต้องล็อกอิน) |
| GET | `/api/v1/companies/{companyId}/jobs` | ทุกคน — เฉพาะงาน OPEN |
| GET | `/api/v1/companies/me` | EMPLOYER — บริษัทของตัวเอง |
| PUT | `/api/v1/companies/me` | EMPLOYER — แก้ข้อมูลบริษัท |

ตัวอย่างผล `GET /companies/{id}`:
```json
{ "status": 200, "message": "OK", "data": {
  "id": "b2ad9a79-...", "nameTh": "Somsak Corperation", "nameEn": null, "industry": "Software",
  "description": "...", "logoUrl": "https://...", "website": "https://...", "email": "hr@...", "phone": "02-...",
  "address": "...", "province": "ขอนแก่น", "status": "ACTIVE", "jobCount": 1 } }
```

body ของ `PUT /companies/me` (ส่งเฉพาะช่องที่จะแก้):
```json
{ "nameTh": "บริษัท ตัวอย่าง จำกัด", "nameEn": "Example Co., Ltd.", "industry": "Software",
  "description": "พัฒนาซอฟต์แวร์", "website": "https://example.co.th", "email": "hr@example.co.th",
  "phone": "02-123-4567", "address": "123 ถ.มิตรภาพ", "province": "ขอนแก่น", "logoUrl": "https://..." }
```

**ADMIN** — `/api/v1/admin/companies` (GET รายการ `?status=&q=&page=&size=`, POST สร้าง, PUT/DELETE `/{id}`)
และ `PATCH /api/v1/admin/companies/{id}/status` body `{ "status": "SUSPENDED", "reason": "..." }`

---

### 5.5 B5 — สมัครเป็นผู้ประกาศงาน + อนุมัติ

**สมัคร** `POST /api/v1/auth/register` — body เดิม + `role`, `companyName`, `companyTaxId` (ไม่บังคับ):
```json
{ "email": "hr@example.co.th", "password": "123456", "fullname": "สมชาย ใจดี", "telephone": "0811111111",
  "role": "EMPLOYER", "companyName": "บริษัท ตัวอย่าง จำกัด", "companyTaxId": "0105555012345" }
```
ผล (**ไม่มี cookie, ยังล็อกอินไม่ได้**):
```json
{ "status": 201, "message": "สมัครสำเร็จ บัญชีผู้ประกาศงานกำลังรอผู้ดูแลระบบอนุมัติ", "code": "EMPLOYER_PENDING",
  "data": { "userId": "...", "email": "...", "role": "EMPLOYER", "accessToken": null, "accountStatus": "PENDING" } }
```
- นักศึกษาสมัครเหมือนเดิม (ไม่ส่ง `role` = STUDENT) → ได้ cookie ใช้งานได้ทันที
- login ตอนรออนุมัติ → 403 `EMPLOYER_PENDING`
- `companyTaxId` ต้องเป็นตัวเลข 10–13 หลัก

**ADMIN อนุมัติ** (หน้าใหม่ในแดชบอร์ดแอดมิน):
| method | path | body |
|---|---|---|
| GET | `/api/v1/admin/employers?status=PENDING` | — (`PENDING` / `ACTIVE` / `REJECTED` / `ALL`) |
| POST | `/api/v1/admin/employers/{userId}/approve` | — |
| POST | `/api/v1/admin/employers/{userId}/reject` | `{ "reason": "ข้อมูลบริษัทไม่ครบ" }` |
| POST | `/api/v1/admin/employers/{userId}/suspend` | `{ "suspended": true, "reason": "..." }` |

ผลของ GET: `[{ "userId", "email", "fullName", "telephone", "accountStatus", "createdAt", "companyId", "companyName", "companyTaxId", "companyStatus" }]`

---

### 5.6 B6 — ประวัติฝึกงาน

**นักศึกษา** (ต้องล็อกอินเป็น STUDENT)
| method | path |
|---|---|
| GET | `/api/v1/internships/me` |
| POST | `/api/v1/internships/me` |
| PUT | `/api/v1/internships/me/{id}` |
| DELETE | `/api/v1/internships/me/{id}` (เฉพาะสถานะ APPLIED / CANCELLED) |

body ของ POST — เลือกระบุบริษัทได้ 3 แบบ (อย่างใดอย่างหนึ่ง):
```json
{ "jobId": "19902324-...", "startDate": "2026-10-01", "endDate": "2027-01-31" }
```
```json
{ "companyId": "b2ad9a79-...", "positionName": "Backend Intern", "startDate": "2026-10-01", "endDate": "2027-01-31" }
```
```json
{ "companyName": "บริษัทนอกระบบ จำกัด", "positionName": "Backend Intern", "startDate": "2026-10-01", "endDate": "2027-01-31",
  "supervisorName": "คุณสมชาย", "supervisorEmail": "somchai@example.com", "studentNote": "..." }
```
ผล:
```json
{ "id": "...", "studentId": "...", "studentName": "...", "companyId": null, "companyName": "บริษัทนอกระบบ จำกัด",
  "positionName": "Backend Intern", "startDate": "2026-10-01", "endDate": "2027-01-31", "status": "APPLIED", "createdAt": "..." }
```
- `status`: `APPLIED` → `ACCEPTED` → `IN_PROGRESS` → `COMPLETED` (หรือ `CANCELLED` / `REJECTED`)
- นักศึกษาเปลี่ยนเองได้แค่ `CANCELLED` (และทุกสถานะ ถ้าเป็นบริษัทนอกระบบ) — นอกนั้นบริษัทเป็นคนเปลี่ยน

**บริษัท** — `GET /api/v1/employer/internships` และ `PATCH /api/v1/employer/internships/{id}` body `{ "status": "ACCEPTED", "companyNote": "ผ่านการคัดเลือก" }`
**ADMIN** — `GET /api/v1/admin/internships?status=&companyId=&page=0&size=20`

---

### 5.7 B7 — นำเข้าบริษัทจากไฟล์ (หน้าแอดมิน)

1. ปุ่ม "ดาวน์โหลด template" → `GET /api/v1/admin/companies/import/template` (ได้ไฟล์ CSV)
2. อัปโหลด → `POST /api/v1/admin/companies/import?dryRun=true` (form-data ช่อง `file`, `.csv` หรือ `.xlsx` ≤ 5 MB)
3. แสดงผลตรวจ → ถ้าโอเค ให้ปุ่ม "ยืนยันนำเข้า" ส่งไฟล์เดิมซ้ำด้วย `dryRun=false`

ผล:
```json
{ "status": 200, "message": "ตรวจไฟล์เสร็จ (ยังไม่บันทึก) — ...", "data": {
  "logId": "...", "dryRun": true, "totalRows": 3, "created": 2, "updated": 0, "skipped": 1,
  "errors": [ { "row": 4, "field": "tax_id", "message": "ต้องเป็นตัวเลข 10–13 หลัก" } ] } }
```
- `row` คือเลขแถวในไฟล์ (หัวตาราง = แถว 1) — แสดงเป็นตารางให้แอดมินแก้
- ประวัติ: `GET /api/v1/admin/imports?page=0&size=20`
- ⚠️ เตือนผู้ใช้: ถ้าแก้ไฟล์ใน Excel ให้ Save เป็น "CSV UTF-8" ไม่งั้นภาษาไทยเพี้ยน (หรือใช้ .xlsx ได้เลย)

---

### 5.8 B8 — เครดิต

`GET /api/v1/users/me/credits`:
```json
{ "status": 200, "message": "OK", "data": {
  "unlimited": false, "monthlyLimit": 30, "used": 6, "remaining": 24,
  "resetAt": "2026-09-30T17:00:00Z", "costs": { "RESUME_UPLOAD": 1, "ASSESSMENT_SUBMIT": 1 } } }
```
- ADMIN ได้ `unlimited: true`, `monthlyLimit`/`remaining` เป็น null
- อัปโหลดเรซูเม่/ส่งแบบประเมินตอนเครดิตหมด → 429 `CREDITS_EXHAUSTED` (หักเครดิตเฉพาะตอนสำเร็จ)
- **แนะนำ UI:** แสดง "เหลือ 24/30 ครั้ง" ใกล้ปุ่มอัปโหลด และปิดปุ่มเมื่อ remaining = 0

ADMIN: `GET /api/v1/admin/usage?userId=&action=&from=2026-09-01&to=2026-09-30&page=0&size=50` และ `GET /api/v1/admin/usage/summary?from=&to=`

---

### 5.9 B9 — นโยบายความเป็นส่วนตัว (PDPA)

**ตอนสมัคร:** `GET /api/v1/policies/current` (ไม่ต้องล็อกอิน):
```json
{ "status": 200, "data": { "policyType": "PRIVACY_POLICY", "version": "1.0", "url": "/privacy-policy",
  "effectiveDate": "2026-09-24", "requiredOnRegister": false } }
```
เพิ่ม checkbox "ยอมรับนโยบาย" ในฟอร์มสมัคร แล้วส่ง `"acceptedPolicyVersion": "1.0"` ไปกับ body register
(ตอนนี้ยังไม่บังคับ — **พอหน้าบ้านเพิ่ม checkbox แล้ว บอก backend ให้เปิดบังคับ**)

**ตอนล็อกอิน:** ผล login และ `/auth/me` มีฟิลด์ใหม่
```json
{ "...": "...", "accountStatus": "ACTIVE", "needsConsent": true }
```
ถ้า `needsConsent: true` → แสดง modal นโยบาย แล้วเรียก
```
POST /api/v1/users/me/consents
```
```json
{ "version": "1.0" }
```

**หน้าตั้งค่าบัญชี:**
| method | path | ใช้ทำ |
|---|---|---|
| GET | `/api/v1/users/me/consents` | ประวัติการยอมรับ |
| DELETE | `/api/v1/users/me/consents` | ถอนความยินยอม |
| GET | `/api/v1/users/me/data-export` | ปุ่ม "ดาวน์โหลดข้อมูลของฉัน" (ได้ไฟล์ JSON) |
| DELETE | `/api/v1/users/me` | ปุ่ม "ลบบัญชี" — body `{ "password": "..." }` หรือบัญชี Google `{ "confirm": "อีเมลตัวเอง" }` |

ลบบัญชีสำเร็จ → cookie ถูกล้าง ให้พากลับหน้าแรก

---

### 5.10 B10 — อื่น ๆ

- **Rate limit:** login/register/google ≤ 10 ครั้ง/นาที, อัปโหลดเรซูเม่ + ส่งแบบประเมิน ≤ 6 ครั้ง/นาที ต่อ IP → เกินได้ 429 `RATE_LIMITED`
- **ส่งแบบประเมินแบบไม่ต้องรอ (ไม่บังคับใช้):** `POST /api/v1/assessments/submit?async=true` → ได้ 202 `{ "taskId": "..." }` ทันที
  แล้วเรียก `GET /api/v1/tasks/{taskId}` ทุก 2–3 วินาที จนกว่า `status` = `DONE` (ผลอยู่ใน `result`) หรือ `FAILED`
  ใช้เมื่อเจอปัญหารอนานเกิน 30 วินาที (Next.js proxy ตัดที่ 30 วินาที — หรือเพิ่ม `experimental: { proxyTimeout: 90000 }` ใน `next.config.ts`)

---

### 5.11 Checklist หน้าบ้าน

| ลำดับ | งาน | ความสำคัญ |
|---|---|---|
| 1 | หน้าผลลัพธ์: แสดง `careerMatches` (B1) | สูง |
| 2 | ฟอร์มสมัคร: เลือก "นักศึกษา / ผู้ประกาศงาน" + ช่องชื่อบริษัท + รับ `EMPLOYER_PENDING` (B5) | สูง |
| 3 | แอดมิน: หน้าอนุมัติผู้ประกาศงาน (B5) | สูง |
| 4 | Checkbox นโยบายในฟอร์มสมัคร + modal เมื่อ `needsConsent` (B9) | สูง |
| 5 | หน้าโปรไฟล์บริษัท + ลิงก์จากการ์ดงาน (B4) | กลาง |
| 6 | ผู้ประกาศงาน: หน้าแก้ข้อมูลบริษัท + ปุ่มเปิด/ปิดประกาศ + วันที่ (B3/B4) | กลาง |
| 7 | แสดงเครดิตคงเหลือ + จัดการ 429 (B8/B10) | กลาง |
| 8 | ประวัติฝึกงาน นักศึกษา/บริษัท (B6) | กลาง |
| 9 | แอดมิน: นำเข้าบริษัทจากไฟล์ (B7), รายงานการใช้งาน (B8) | ต่ำ |
| 10 | ตั้งค่าบัญชี: ดาวน์โหลดข้อมูล / ลบบัญชี (B9) | ต่ำ |
| 11 | ป้าย "AI" ใน matchDetails (B2) | ต่ำ |

---

### 5.12 วิธีทดสอบ

ขั้นตอนทดสอบทุกฟีเจอร์แบบทีละ Flow (นักศึกษา / ผู้ประกาศงาน / แอดมิน / สาธารณะ) พร้อมโค้ดที่วางใน Console ได้เลย
อยู่ในไฟล์ **`TESTING_FLOWS.md`** ที่ root ของโปรเจกต์

---

### 5.13 ตอบ FRONTEND_REQUESTS (24 ก.ย. 2569)

**ยืนยัน**
- `GET /api/v1/admin/employers` ห่อใน `{ status, message, data }` และ `data` เป็น array
- path หน้านโยบายคือ `/privacy-policy` (มาจาก `GET /policies/current` ช่อง `url`) — **เนื้อหาร่างอยู่ที่ `docs/PRIVACY_POLICY_TH.md`** (ยังต้องให้เจ้าของโครงงานตรวจก่อนเผยแพร่)
- 403 `EMPLOYER_REJECTED` มีเหตุผลใน `message` อยู่แล้ว เช่น `"บัญชีผู้ประกาศงานไม่ผ่านการอนุมัติ (เหตุผล: ข้อมูลไม่ครบ)"`
- `requiredOnRegister` ยังเป็น `false` จนกว่าหน้า `/privacy-policy` จะเสร็จ

**ฟิลด์ใหม่ (optional ทั้งหมด)**

`careerMatches[].roleNameTh` — ชื่อสายงานภาษาไทย:
```json
{ "roleName": "Software Developers, Applications", "roleNameTh": "นักพัฒนาซอฟต์แวร์ (แอปพลิเคชัน)", "percent": 32, "...": "..." }
```

`requiredSkillsDetail` ในประกาศงาน (`/workplaces`, `/workplaces/{id}`, `/workplaces?page=`) — **มีเฉพาะตอนล็อกอินและเคยอัปโหลดเรซูเม่แล้ว**
เทียบกับเรซูเม่ล่าสุดของผู้ใช้ `requiredSkills` แบบเดิมยังอยู่เหมือนเดิม:
```json
"requiredSkills": ["Java", "Docker"],
"requiredSkillsDetail": [ { "skillName": "Java", "isMatch": true }, { "skillName": "Docker", "isMatch": false } ]
```

**Cost per action (ADMIN)** — `GET /api/v1/admin/usage/cost?from=2026-09-01&to=2026-09-30`
```json
{ "data": {
  "pricePer1M": { "input": 0.1, "output": 0.4, "currency": "USD" },
  "byAction": [
    { "name": "ASSESSMENT_SUBMIT", "samples": 12, "model": "gemini-3.1-flash-lite-preview", "avgInputTokens": 5400, "avgOutputTokens": 1300, "avgCost": 0.00106 },
    { "name": "RESUME_UPLOAD", "...": "..." } ],
  "byPythonEndpoint": [
    { "name": "judge-skill-matches", "samples": 12, "avgLlmCalls": 1.0, "avgInputTokens": 2100, "avgOutputTokens": 900, "avgCost": 0.00057 } ] } }
```
(ตัวเลขข้างบนเป็นรูปแบบตัวอย่าง ไม่ใช่ค่าจริง)
- เริ่มนับ token ตั้งแต่ deploy รอบนี้ — log ก่อนหน้านี้ไม่มีตัวเลข ต้องใช้งานจริงสักพักก่อนจะได้ค่าเฉลี่ย
- `judge-skill-matches` = ค่าใช้จ่ายของ semantic matching (B2), `process-resume` = อัปโหลดเรซูเม่
- ราคาต่อ 1M token ตั้งที่ backend (`app.llm.price.*`) ถ้ายังเป็น 0 ช่อง `avgCost` จะเป็น 0
