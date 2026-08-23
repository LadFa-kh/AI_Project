from fastapi import FastAPI, UploadFile, File, HTTPException, Form
import pdfplumber
import uuid
import io
import json
import os
from pydantic import BaseModel, Field
from typing import List
from google import genai

app = FastAPI()

# -------------------------------------------------------------
# 1. Pydantic Schemas (ปรับตาม requirements ฝั่ง Frontend)
# -------------------------------------------------------------
class ResumeSchema(BaseModel):
    skills: List[str] = Field(description="รายการ ทักษะ/Hard Skills ทั้งหมดที่พบ")

class EvaluationQuestion(BaseModel):
    id: str = Field(description="UUID format string สำหรับระบุไอดีคำถาม")
    question: str = Field(description="คำถามประเมินตนเองเกี่ยวกับทักษะของผู้สมัครที่เชื่อมโยงกับตำแหน่งงานเป้าหมาย")
    options: List[str] = Field(description="ตัวเลือก 4 ข้อเสมอ คือ ['1. พอใช้', '2. มาตรฐาน', '3. ดี', '4. ดีมาก']")

class QuestionListSchema(BaseModel):
    questions: List[EvaluationQuestion]

# เพิ่ม Schema สำหรับรับผลวิเคราะห์ Gap ทักษะเทียบกับตำแหน่งงาน
class GapAnalysisSchema(BaseModel):
    missing_skills: List[str] = Field(description="รายการทักษะที่จำเป็นสำหรับตำแหน่งงานนี้ แต่ยังไม่มีในเรซูเม่")
    recommendation: str = Field(description="คำแนะนำในการพัฒนาตนเองเพื่อให้เหมาะกับตำแหน่งงานเป้าหมาย")

class AssessmentResponse(BaseModel):
    resume_data: ResumeSchema
    gap_analysis: GapAnalysisSchema
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
# API key now read from the environment (set via docker-compose.yml / the
# platform's secret store) instead of being hardcoded here — the previous
# hardcoded value was a real committed secret and should be treated as
# compromised: rotate/revoke it in the CometAPI dashboard regardless of this
# code change, since it may already be in git history and on GitHub.
BASE_URL = "https://api.cometapi.com"
COMET_API_KEY = os.environ["COMET_API_KEY"]

client = genai.Client(
    http_options={"api_version": "v1beta", "base_url": BASE_URL},
    api_key=COMET_API_KEY,
)


# -------------------------------------------------------------
# 4. API Endpoint
# -------------------------------------------------------------
@app.post("/api/v1/python/process-resume", response_model=AssessmentResponse)
async def process_resume(
        file: UploadFile = File(...),
        desiredRoleName: str = Form(...),
        standardSkills: str = Form(default="")
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="กรุณาอัปโหลดไฟล์ PDF เท่านั้น")

    pdf_bytes = await file.read()
    raw_text = extract_text_from_pdf(pdf_bytes)

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="ไม่สามารถอ่านข้อความจาก PDF ได้")

    try:
        # A) สกัดข้อมูล Resume
        resume_prompt = f"""
        คุณเป็น HR Expert โปรดอ่านข้อความจาก Resume ต่อไปนี้ 
        ทำความสะอาดข้อมูล และสกัดข้อมูลทักษะออกมา:
        
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

        # แปลงรายชื่อทักษะมาตรฐานที่รับมาจาก Java
        skills_list = []
        if standardSkills:
            skills_list = [s.strip() for s in standardSkills.split("|") if s.strip()]

        # B) วิเคราะห์ Gap ทักษะ เทียบกับตำแหน่งงานที่ต้องการ (Desired Role)
        gap_prompt = f"""
        ผู้สมัครต้องการสมัครตำแหน่งงาน: "{desiredRoleName}"
        
        ทักษะมาตรฐานสากล O*NET (รวมเครื่องมือและหมวดหมู่ทักษะ): 
        {skills_list}
        
        ทักษะจริงที่พบใน Resume ของผู้สมัคร: 
        {resume_data.skills}
        
        โปรดวิเคราะห์ความสอดคล้องอย่างถี่ถ้วน:
        1. ให้เปรียบเทียบทั้งชื่อเครื่องมือตรงๆ และความหมายเชิงหมวดหมู่ (เช่น หากมาตรฐานต้องการ Spreadsheet software และ Resume มี Excel ให้ถือว่าครอบคลุม)
        2. สรุปเฉพาะทักษะมาตรฐานที่ผู้สมัครยังขาดอยู่อย่างแท้จริง (Missing Skills)
        3. ให้คำแนะนำ (Recommendation) สำหรับการพัฒนาทักษะเพิ่มเติม
        """

        response_gap = client.models.generate_content(
            model="gemini-3.1-flash-lite-preview",
            contents=gap_prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': GapAnalysisSchema,
            }
        )
        gap_analysis = GapAnalysisSchema.model_validate_json(response_gap.text)

        # C) สร้างแบบประเมินตนเอง 5 ข้อ

        question_prompt = f"""
        ตำแหน่งงานเป้าหมาย: {desiredRoleName}
        ทักษะของผู้สมัคร: {resume_data.skills}
        ทักษะที่ยังขาด: {gap_analysis.missing_skills}
        
        จงสร้าง "แบบประเมินตนเอง" จำนวนไม่เกิน 5 ข้อ เพื่อวัดความมั่นใจในทักษะที่จำเป็นสำหรับตำแหน่งนี้
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

        # แปลง id ของคำถามแต่ละข้อให้เป็น UUID String ป้องกันปัญหา Type ไม่แมตช์กับ Java
        formatted_questions = [
            EvaluationQuestion(
                id=str(uuid.uuid4()),
                question=q.question,
                options=q.options
            )
            for q in questions_obj.questions
        ]

        # ส่ง JSON ผลลัพธ์ทั้งหมดกลับไป
        return AssessmentResponse(
            resume_data=resume_data,
            gap_analysis=gap_analysis,
            questions=formatted_questions
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Processing Error: {str(e)}")