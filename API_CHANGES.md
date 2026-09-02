# API_CHANGES — การเปลี่ยนแปลงฝั่ง Backend สำหรับทีม Frontend

เอกสารนี้สรุปสิ่งที่เปลี่ยนในฝั่งหลังบ้าน เพื่อให้ทีมหน้าบ้านรู้ว่าต้องแก้อะไรบ้าง

**สรุปสั้นที่สุด:** ไม่มี breaking change ฟิลด์เดิมทุกตัวยังอยู่ครบและความหมายไม่เปลี่ยน
มีแค่ **ฟิลด์ใหม่ 2 ตัวถูกเพิ่มเข้ามา** กับ **endpoint ใหม่ 1 ตัว** ถ้าไม่แก้อะไรเลยระบบก็ยังทำงานได้ตามเดิม

---

## สารบัญ

1. [ฟิลด์ใหม่ใน POST /assessments/submit](#1-ฟิลด์ใหม่ใน-post-apiv1assessmentssubmit)
2. [Endpoint ใหม่ GET /jobs/{id}](#2-endpoint-ใหม่-get-apiv1jobsid)
3. [อายุ session เปลี่ยนจาก 15 นาที เป็น 1 วัน](#3-อายุ-session-เปลี่ยนจาก-15-นาที-เป็น-1-วัน)
4. [สูตรคำนวณคะแนน สำหรับอ้างอิง](#4-สูตรคำนวณคะแนน-สำหรับอ้างอิง)

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

## 2. Endpoint ใหม่ `GET /api/v1/jobs/{id}`

### สิ่งที่เปลี่ยน

เดิมไม่มี endpoint ดึงตำแหน่งงานทีละรายการ หน้ารายละเอียดฝึกงานจึงต้องอ่านจาก
`sessionStorage` ของหน้ารายการ ซึ่งมีแค่ชื่อบริษัท ตำแหน่ง ประเภทงาน และทักษะ
ฟิลด์อย่างคำอธิบายงาน ระยะเวลา ค่าตอบแทน และลิงก์สมัคร จึงไม่เคยถูกส่งมาถึงหน้าเว็บ
ทั้งที่บันทึกอยู่ในฐานข้อมูลครบถ้วน

### Request

```
GET /api/v1/jobs/{id}
```

ต้องล็อกอินก่อน (ใช้ cookie `accessToken` เหมือน endpoint อื่น ต้องส่ง `credentials: "include"`)

### Response

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

### ข้อควรระวัง 3 ข้อ

**1. ฟิลด์ id ชื่อไม่ตรงกับ endpoint อื่น**

endpoint นี้คืน `id` แต่ `GET /matching/recommendations` คืน `jobId`
ต้อง map ให้ตรงกับ type ที่ใช้อยู่ก่อนนำไปแสดง

**2. endpoint นี้ไม่คืนคะแนนความเหมาะสม**

`userFinalScore` / `matchedSkills` / `missingSkills` เป็นข้อมูลเฉพาะบุคคล
ไม่ใช่ข้อมูลของประกาศ จึงไม่ได้อยู่ใน endpoint นี้
ถ้าต้องการแสดงคะแนนด้วย ต้องผสมกับข้อมูลจาก `sessionStorage` ของหน้ารายการเหมือนเดิม

**3. ฟิลด์ที่เป็น optional ใน DB เป็น `null` ได้**

`jobType`, `jobDescription`, `duration`, `salary`, `contactLink` ผู้ประกาศอาจไม่ได้กรอก
ต้องเช็คก่อนแสดงทุกตัว

```ts
export type JobDetail = {
  id: string;
  companyName: string;
  jobType: string | null;
  positionName: string;
  requiredSkills: string[];
  jobDescription: string | null;
  duration: string | null;
  salary: string | null;
  contactLink: string | null;
};
```

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
| เพิ่ม service เรียก `GET /jobs/{id}` และใช้ในหน้ารายละเอียดฝึกงาน | ต้องทำ ถ้าจะใช้ |
| แก้ข้อความที่อ้างถึง session 15 นาที | ทำถ้ามี |
| แก้โค้ดเดิมที่ใช้อยู่ | **ไม่ต้อง** ฟิลด์เดิมไม่เปลี่ยน |

ถ้าไม่แก้อะไรเลย ระบบยังทำงานได้ตามเดิมทุกอย่าง
