from fastapi import FastAPI, UploadFile, File, HTTPException
import pdfplumber
import io
from enum import Enum
from pydantic import BaseModel, Field
from typing import List
from google import genai

app = FastAPI()

# -------------------------------------------------------------
# 1. Pydantic Schemas (ปรับโครงสร้างให้แยก HARD / SOFT Skill)
# -------------------------------------------------------------
class SkillType(str, Enum):
    HARD = "HARD"
    SOFT = "SOFT"

class SkillItem(BaseModel):
    skillName: str = Field(description="ชื่อทักษะ เช่น Java, Communication, Time Management")
    skillType: SkillType = Field(description="ประเภทของทักษะ ต้องเป็น 'HARD' หรือ 'SOFT' เท่านั้น")

class ResumeSchema(BaseModel):
    skills: List[SkillItem] = Field(description="รายการทักษะที่ผ่านการคัดกรองและจัดหมวดหมู่แล้ว")

class EvaluationQuestion(BaseModel):
    id: int
    question: str = Field(description="คำถามประเมินตนเองเกี่ยวกับทักษะของผู้สมัคร")
    options: List[str] = Field(description="ตัวเลือก 4 ข้อเสมอ คือ ['1. พอใช้', '2. มาตรฐาน', '3. ดี', '4. ดีมาก']")

class QuestionListSchema(BaseModel):
    questions: List[EvaluationQuestion]

class AssessmentResponse(BaseModel):
    resume_data: ResumeSchema
    questions: List[EvaluationQuestion]


# -------------------------------------------------------------
# 2. Function ดึงข้อความจาก PDF
# -------------------------------------------------------------
def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    extracted_text = ""
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"
    return extracted_text


# -------------------------------------------------------------
# 3. Setup CometAPI Client
# -------------------------------------------------------------
BASE_URL = "https://api.cometapi.com"
COMET_API_KEY = "5D7qu1s2K8C5zjqC0OR2Hp1jcFruu53pltn6YH8BxGmWJT62"

client = genai.Client(
    http_options={"api_version": "v1beta", "base_url": BASE_URL},
    api_key=COMET_API_KEY,
)


# -------------------------------------------------------------
# 4. API Endpoint
# -------------------------------------------------------------
@app.post("/api/v1/python/process-resume", response_model=AssessmentResponse)
async def process_resume(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="กรุณาอัปโหลดไฟล์ PDF เท่านั้น")

    pdf_bytes = await file.read()
    raw_text = extract_text_from_pdf(pdf_bytes)

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="ไม่สามารถอ่านข้อความจาก PDF ได้ (อาจเป็นไฟล์สแกน/รูปภาพ)")

    try:
        # A) สกัดและคัดกรองข้อมูล Skills (คัดขยะทิ้ง + แยก HARD/SOFT)
        resume_prompt = f"""
        คุณเป็น HR และ Technical Recruiter Expert โปรดอ่านข้อความจาก Resume ต่อไปนี้ 
        และสกัดข้อมูลทักษะ (Skills) ออกมาโดยปฏิบัติตามกฎอย่างเคร่งครัด:

        [กฎการสกัดและจัดหมวดหมู่ทักษะ]
        1. **FILTER OUT (คัดกรองทิ้ง):** ห้ามสกัดกิจกรรมที่ไม่เกี่ยวกับงาน, งานอดิเรกที่ไม่เป็นทางการ, หรือข้อความตลกขบขัน (เช่น "Playing Mobile Legends", "Sleeping", "Complaining about politics", "Watching TikTok") ออกมาเด็ดขาด!
        2. **HARD SKILLS:** ใช้กับทักษะทางเทคนิค, ภาษาโปรแกรม, Framework, เครื่องมือ, ดาต้าเบส, หรือความรู้เฉพาะทางงาน (เช่น Java, Docker, HTML, PostgreSQL, English)
        3. **SOFT SKILLS:** ใช้กับทักษะทางอารมณ์, บุคลิกภาพ, การทำงานร่วมกับผู้อื่น, การแก้ปัญหา, หรือการปรับตัว (เช่น Teamwork, Leadership, Communication)
        4. **FALLBACK RULE:** หากทักษะใดเป็นทักษะการทำงานที่ถูกต้อง แต่ไม่ใช่ทักษะทางเทคนิค (Hard Skill) ให้ระบุประเภทเป็น "SOFT" เสมอ!

        TEXT จาก PDF:
        {raw_text}
        """

        response_resume = client.models.generate_content(
            model="gemini-3.1-flash-lite-preview",
            contents=resume_prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': ResumeSchema,
            }
        )

        resume_data = ResumeSchema.model_validate_json(response_resume.text)

        # B) สร้างแบบประเมินตนเองสูงสุด 5 ข้อ (ส่งเฉพาะทักษะที่สกัดได้ไปสร้างคำถาม)
        extracted_skills_list = [f"{s.skillName} ({s.skillType})" for s in resume_data.skills]

        question_prompt = f"""
        จากรายการทักษะของผู้สมัครต่อไปนี้:
        Skills: {extracted_skills_list}
        
        จงสร้าง "แบบประเมินตนเอง" จำนวนไม่เกิน 5 ข้อ เพื่อวัดระดับความมั่นใจในทักษะงานที่สำคัญของผู้สมัคร
        ทุกข้อต้องมีตัวเลือก 4 ระดับเสมอ คือ ["1. พอใช้", "2. มาตรฐาน", "3. ดี", "4. ดีมาก"]
        """

        response_questions = client.models.generate_content(
            model="gemini-3.1-flash-lite-preview",
            contents=question_prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': QuestionListSchema,
            }
        )

        questions_obj = QuestionListSchema.model_validate_json(response_questions.text)

        # ส่ง JSON กลับ
        return AssessmentResponse(
            resume_data=resume_data,
            questions=questions_obj.questions
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Processing Error: {str(e)}")