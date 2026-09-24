import logging
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
import pdfplumber
import uuid
import io
import os
from pydantic import BaseModel, Field
from typing import List
from google import genai
from pythainlp.util import normalize
from pythainlp.tokenize import word_tokenize

app = FastAPI()
logger = logging.getLogger(__name__)

# -------------------------------------------------------------
# 1. Pydantic Schemas
# -------------------------------------------------------------
class ResumeSchema(BaseModel):
    hard_skills: List[str] = Field(
        description="ทักษะด้านเทคนิคเฉพาะทาง เช่น โปรแกรม เครื่องมือ ภาษาโปรแกรม เทคโนโลยี (เช่น Python, Excel, SAP, AutoCAD)"
    )
    soft_skills: List[str] = Field(
        description="ทักษะทั่วไป/สมรรถนะส่วนบุคคล เช่น การสื่อสาร การทำงานเป็นทีม ภาวะผู้นำ การแก้ปัญหา การบริหารเวลา"
    )

FIXED_ASSESSMENT_OPTIONS = ["1. พอใช้", "2. มาตรฐาน", "3. ดี", "4. ดีมาก"]

class GeneratedQuestion(BaseModel):
    question: str = Field(description="คำถามประเมินตนเองเกี่ยวกับทักษะของผู้สมัครที่เชื่อมโยงกับตำแหน่งงานเป้าหมาย")

class QuestionListSchema(BaseModel):
    questions: List[GeneratedQuestion]

class EvaluationQuestion(BaseModel):
    id: str = Field(description="UUID format string สำหรับระบุไอดีคำถาม")
    question: str
    options: List[str] = Field(description="ตัวเลือก 4 ข้อเสมอ")

class AssessmentResponse(BaseModel):
    resume_data: ResumeSchema
    questions: List[EvaluationQuestion]

class RoleTranslationSchema(BaseModel):
    english_role_name: str = Field(
        description="ชื่อตำแหน่งงานที่แปลเป็นภาษาอังกฤษ ให้ตรงกับชื่ออาชีพมาตรฐานสากลแบบ O*NET (เช่น 'Web Developers', 'Software Developers', 'Data Scientists') เลือกชื่อที่ใกล้เคียงที่สุดแม้ต้นฉบับจะเขียนไม่เป็นทางการ"
    )

class RecommendationResponseSchema(BaseModel):
    missing_skills: List[str] = Field(description="รายการทักษะที่จำเป็นสำหรับตำแหน่งงานนี้ แต่ยังไม่มีในเรซูเม่")
    recommendation_summary: str = Field(description="คำแนะนำแบบย่อหน้าเดียวสรุปภาพรวม สำหรับแสดงแบบข้อความปกติ")
    recommendation_items: List[str] = Field(description="คำแนะนำแยกเป็นข้อ ๆ อย่างละเอียด สั้นกระชับต่อข้อ สำหรับแสดงเป็น bullet list")
    score_explanation: str = Field(
        description=(
            "คำอธิบายภาษาไทยว่าคะแนนที่ผู้ใช้ได้มาจากส่วนไหนบ้าง ส่วนละเท่าไหร่ และคิดมาอย่างไร "
            "ต้องใช้ตัวเลขจากข้อมูลที่ให้ไปเท่านั้น ห้ามคำนวณเลขใหม่หรือปัดเศษเอง "
            "เขียนเป็นย่อหน้าที่อ่านลื่น ไล่ตามลำดับ: คะแนนเรซูเม่มาจากอะไร คะแนนแบบประเมินมาจากอะไร "
            "แล้วสองส่วนถ่วงน้ำหนักรวมกันเป็นคะแนนสุดท้ายอย่างไร"
        )
    )

# [NEW] ใช้ตอนผู้สมัครไม่ได้กรอก desiredRoleName มา — ให้ AI เดาอาชีพที่เหมาะสมจากทักษะในเรซูเม่แทน
class RoleInferenceSchema(BaseModel):
    inferred_role_name: str = Field(
        description="ชื่อตำแหน่งงานภาษาอังกฤษที่เหมาะสมที่สุดกับชุดทักษะนี้ ให้ตรงกับชื่ออาชีพมาตรฐาน O*NET มากที่สุด (เช่น 'Software Developers', 'Web Developers', 'Data Analysts')"
    )


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
# 2.1 Function ทำความสะอาดข้อความภาษาไทยก่อนส่งเข้า LLM
# -------------------------------------------------------------
def preprocess_thai_text(raw_text: str) -> str:
    text = normalize(raw_text)
    tokens = word_tokenize(text, engine="newmm")
    return " ".join(t for t in tokens if t.strip())


# -------------------------------------------------------------
# 3. Setup CometAPI Client
# -------------------------------------------------------------
BASE_URL = "https://api.cometapi.com"
COMET_API_KEY = os.getenv("COMET_API_KEY")

client = genai.Client(
    http_options={"api_version": "v1beta", "base_url": BASE_URL},
    api_key=COMET_API_KEY,
)


# -------------------------------------------------------------
# 4. Endpoint: อัปโหลด Resume
# -------------------------------------------------------------
@app.post("/api/v1/python/process-resume", response_model=AssessmentResponse)
def process_resume(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="กรุณาอัปโหลดไฟล์ PDF เท่านั้น")

    pdf_bytes = file.file.read()
    raw_text = extract_text_from_pdf(pdf_bytes)

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="ไม่สามารถอ่านข้อความจาก PDF ได้")

    cleaned_text = preprocess_thai_text(raw_text)

    try:
        resume_prompt = f"""
        คุณเป็น HR Expert โปรดอ่านข้อความจาก Resume ต่อไปนี้ 
        ทำความสะอาดข้อมูล และสกัดข้อมูลทักษะออกมา:
        
        TEXT จาก PDF:
        {cleaned_text}
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

        question_prompt = f"""
        ทักษะที่พบในเรซูเม่ของผู้สมัคร: {resume_data.hard_skills}

        จงสร้าง "แบบประเมินตนเอง" จำนวนไม่เกิน 5 ข้อ เพื่อให้ผู้สมัครประเมินความมั่นใจ/ความชำนาญ
        ในทักษะที่ระบุไว้ในเรซูเม่ของตนเองแต่ละอย่าง
        แต่ละข้อให้ตอบเฉพาะข้อความคำถามเท่านั้น (ไม่ต้องสร้างตัวเลือก ระบบจะใส่ตัวเลือกให้เอง)
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

        formatted_questions = [
            EvaluationQuestion(
                id=str(uuid.uuid4()),
                question=q.question,
                options=FIXED_ASSESSMENT_OPTIONS
            )
            for q in questions_obj.questions
        ]

        return AssessmentResponse(
            resume_data=resume_data,
            questions=formatted_questions
        )

    except Exception as e:
        logger.exception("Resume processing failed")
        raise HTTPException(status_code=500, detail=f"AI Processing Error: {str(e)}")


# -------------------------------------------------------------
# 5. Endpoint: สร้างคำแนะนำสุดท้าย หลัง submit assessment
# -------------------------------------------------------------
@app.post("/api/v1/python/generate-recommendation", response_model=RecommendationResponseSchema)
def generate_recommendation(
        desiredRoleName: str = Form(...),
        standardSkills: str = Form(default=""),
        hardSkills: str = Form(default=""),
        assessmentSummary: str = Form(default=""),
        scoreFacts: str = Form(default="")
):
    try:
        standard_list = [s.strip() for s in standardSkills.split("|") if s.strip()] if standardSkills else []
        hard_list = [s.strip() for s in hardSkills.split("|") if s.strip()] if hardSkills else []

        recommendation_prompt = f"""
        ผู้สมัครต้องการสมัครตำแหน่งงาน: "{desiredRoleName}"

        ทักษะมาตรฐานสากล O*NET ที่เกี่ยวข้องกับตำแหน่งนี้:
        {standard_list}

        ทักษะจริงที่พบใน Resume ของผู้สมัคร:
        {hard_list}

        ผลการประเมินความมั่นใจของผู้สมัครในแต่ละทักษะ (จากแบบประเมินตนเอง แต่ละบรรทัดคือ 1 คำถาม รูปแบบ "คำถาม: คะแนน/4"):
        {assessmentSummary}

        โปรดวิเคราะห์และให้คำแนะนำ:
        1. เปรียบเทียบทักษะมาตรฐานกับทักษะจริงของผู้สมัคร ทั้งชื่อเครื่องมือตรงๆ และความหมายเชิงหมวดหมู่
        2. สรุปเฉพาะทักษะมาตรฐานที่ผู้สมัครยังขาดอยู่อย่างแท้จริง (missing_skills)
        3. เขียนคำแนะนำ 2 รูปแบบพร้อมกัน:
           - recommendation_summary: สรุปภาพรวมเป็นย่อหน้าเดียว อ่านลื่นไหล
           - recommendation_items: แยกคำแนะนำเป็นข้อ ๆ (3-5 ข้อ) แต่ละข้อสั้นกระชับ เจาะจงทักษะที่ควรพัฒนา
           โดยพิจารณาผลการประเมินความมั่นใจร่วมด้วย เช่น หากมีทักษะแต่มั่นใจน้อย ให้แนะนำการฝึกฝนเพิ่มเติมในทักษะนั้นโดยเฉพาะ
        4. เขียน score_explanation อธิบายที่มาของคะแนนตามข้อมูลด้านล่างนี้

        ===== ที่มาของคะแนน (คำนวณจากระบบแล้ว ห้ามคำนวณใหม่) =====
        {scoreFacts}
        ==========================================================

        กติกาสำคัญของ score_explanation:
        - ใช้ตัวเลขจากบล็อกด้านบนตรง ๆ เท่านั้น ห้ามคำนวณเอง ห้ามปัดเศษเอง ห้ามเดาตัวเลขที่ไม่มีให้
          ตัวเลขชุดนี้จะถูกแสดงบนหน้าจอพร้อมกับคำอธิบาย ถ้าไม่ตรงกันผู้ใช้จะสับสนทันที
        - อธิบายเรียงสามส่วน: คะแนนเรซูเม่มาจากอะไร คะแนนแบบประเมินมาจากอะไร
          และสองส่วนถ่วงน้ำหนักรวมกันเป็นคะแนนสุดท้ายอย่างไร
        - ถ้ามีการคูณตัวถ่วง (ค่าน้อยกว่า 1) ต้องอธิบายให้ชัดว่าเพราะจับคู่ทักษะได้น้อย
          ระบบจึงลดคะแนนลงเพื่อไม่ให้สูงเกินจริง ไม่ใช่ความผิดพลาดของระบบ
        - ถ้าตำแหน่งงานเป็นตัวที่ระบบวิเคราะห์ให้เอง ให้บอกผู้ใช้ด้วยว่าเทียบกับตำแหน่งใด
          เพราะผู้ใช้อาจไม่รู้ตัวว่าไม่ได้กรอกตำแหน่งงานไว้
        - ถ้าไม่พบทักษะมาตรฐานของตำแหน่งนั้นในฐานข้อมูล ให้บอกตรง ๆ ว่าระบบยังเทียบให้ไม่ได้
          ไม่ใช่ว่าผู้สมัครไม่มีทักษะ
        - ใช้ภาษาสุภาพ เป็นกลาง อ่านเข้าใจง่าย ไม่ต้องใช้ศัพท์เทคนิคอย่าง precision หรือ penalty factor
          ให้อธิบายด้วยคำธรรมดาแทน
        """

        response = client.models.generate_content(
            model="gemini-3.1-flash-lite-preview",
            contents=recommendation_prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': RecommendationResponseSchema,
            }
        )
        return RecommendationResponseSchema.model_validate_json(response.text)

    except Exception as e:
        logger.exception("Recommendation generation failed")
        raise HTTPException(status_code=500, detail=f"AI Processing Error: {str(e)}")


@app.post("/api/v1/python/translate-role-name", response_model=RoleTranslationSchema)
def translate_role_name(desiredRoleName: str = Form(...)):
    try:
        translate_prompt = f"""
        แปลชื่อตำแหน่งงานต่อไปนี้เป็นภาษาอังกฤษ โดยเลือกให้ตรงกับชื่ออาชีพมาตรฐาน O*NET มากที่สุด
        ตอบเฉพาะชื่อตำแหน่งภาษาอังกฤษเท่านั้น ไม่ต้องอธิบายเพิ่ม:

        ตำแหน่งงาน: "{desiredRoleName}"
        """

        response = client.models.generate_content(
            model="gemini-3.1-flash-lite-preview",
            contents=translate_prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': RoleTranslationSchema,
            }
        )
        return RoleTranslationSchema.model_validate_json(response.text)

    except Exception as e:
        logger.exception("Role name translation failed")
        raise HTTPException(status_code=500, detail=f"AI Processing Error: {str(e)}")


# -------------------------------------------------------------
# [NEW] Endpoint: เดาอาชีพที่เหมาะสมจากทักษะในเรซูเม่ — ใช้เมื่อ user ไม่กรอก desiredRoleName
# -------------------------------------------------------------
@app.post("/api/v1/python/infer-role-from-skills", response_model=RoleInferenceSchema)
def infer_role_from_skills(hardSkills: str = Form(default="")):
    try:
        skills_list = [s.strip() for s in hardSkills.split("|") if s.strip()] if hardSkills else []

        inference_prompt = f"""
        ต่อไปนี้คือทักษะด้านเทคนิค (hard skills) ที่พบในเรซูเม่ของผู้สมัคร:
        {skills_list}

        จากชุดทักษะนี้ โปรดวิเคราะห์ว่าผู้สมัครน่าจะเหมาะกับตำแหน่งงานใดมากที่สุด
        ตอบเป็นชื่อตำแหน่งงานภาษาอังกฤษที่ตรงกับมาตรฐานอาชีพ O*NET มากที่สุดเพียงชื่อเดียว
        """

        response = client.models.generate_content(
            model="gemini-3.1-flash-lite-preview",
            contents=inference_prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': RoleInferenceSchema,
            }
        )
        return RoleInferenceSchema.model_validate_json(response.text)

    except Exception as e:
        logger.exception("Role inference from skills failed")
        raise HTTPException(status_code=500, detail=f"AI Processing Error: {str(e)}")

# -------------------------------------------------------------
# [B1] เดาอาชีพที่เหมาะสม 1–4 ตำแหน่งจากทักษะในเรซูเม่ (ใช้ทำ careerMatches)
# ตัวเลขเปอร์เซ็นต์ไม่ได้มาจากที่นี่ — Java คำนวณเองจากการจับคู่ทักษะกับ O*NET
# -------------------------------------------------------------
class RoleCandidatesSchema(BaseModel):
    roles: List[str] = Field(
        description="ชื่อตำแหน่งงานภาษาอังกฤษตามชื่ออาชีพมาตรฐาน O*NET เรียงจากเหมาะที่สุดไปน้อยที่สุด 1 ถึง 4 ชื่อ ไม่ซ้ำกัน"
    )


@app.post("/api/v1/python/infer-roles-from-skills", response_model=RoleCandidatesSchema)
def infer_roles_from_skills(hardSkills: str = Form(default=""), maxRoles: int = Form(default=4)):
    try:
        skills_list = [s.strip() for s in hardSkills.split("|") if s.strip()] if hardSkills else []
        max_roles = max(1, min(int(maxRoles), 4))
        prompt = f"""
        ต่อไปนี้คือทักษะด้านเทคนิค (hard skills) ที่พบในเรซูเม่ของผู้สมัคร:
        {skills_list}

        เลือกตำแหน่งงานที่ผู้สมัครน่าจะเหมาะ 1 ถึง {max_roles} ตำแหน่ง เรียงจากเหมาะที่สุด
        ใช้ชื่อตำแหน่งภาษาอังกฤษที่ตรงกับชื่ออาชีพมาตรฐาน O*NET และห้ามซ้ำกัน
        ถ้าทักษะชี้ไปทางเดียวชัดเจน ตอบตำแหน่งเดียวก็ได้
        """
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite-preview",
            contents=prompt,
            config={'response_mime_type': 'application/json', 'response_schema': RoleCandidatesSchema},
        )
        result = RoleCandidatesSchema.model_validate_json(response.text)
        seen, roles = set(), []
        for r in result.roles:
            key = r.strip().lower()
            if key and key not in seen:
                seen.add(key)
                roles.append(r.strip())
        return RoleCandidatesSchema(roles=roles[:max_roles])
    except Exception as e:
        logger.exception("Role candidates inference failed")
        raise HTTPException(status_code=500, detail=f"AI Processing Error: {str(e)}")


# -------------------------------------------------------------
# [B2] LLM ตัดสินว่าคู่ทักษะ (ทักษะในเรซูเม่, ทักษะมาตรฐาน) หมายถึงสิ่งเดียวกัน/ครอบคลุมกันไหม
# Java เป็นคนคัดคู่ผู้สมัคร (retrieval) และเก็บผลไว้ใน cache — ที่นี่แค่ตัดสิน
# -------------------------------------------------------------
class SkillPairIn(BaseModel):
    resume_skill: str
    standard_skill: str


class SkillJudgeRequest(BaseModel):
    pairs: List[SkillPairIn]


class SkillPairVerdict(BaseModel):
    resume_skill: str
    standard_skill: str
    is_match: bool = Field(description="true ถ้าทักษะในเรซูเม่เป็นสิ่งเดียวกัน เป็นส่วนหนึ่ง หรือเป็นเครื่องมือของทักษะมาตรฐานนั้นโดยตรง")
    confidence: float = Field(description="ความมั่นใจ 0.0 ถึง 1.0")


class SkillJudgeResponse(BaseModel):
    verdicts: List[SkillPairVerdict]


@app.post("/api/v1/python/judge-skill-matches", response_model=SkillJudgeResponse)
def judge_skill_matches(req: SkillJudgeRequest):
    if not req.pairs:
        return SkillJudgeResponse(verdicts=[])
    try:
        pairs_text = "\n".join(
            f'{i + 1}. resume_skill="{p.resume_skill}" | standard_skill="{p.standard_skill}"'
            for i, p in enumerate(req.pairs[:60])
        )
        prompt = f"""
        ตัดสินแต่ละคู่ว่า resume_skill (ทักษะในเรซูเม่) ถือว่าตรงกับ standard_skill (ทักษะมาตรฐาน O*NET) หรือไม่
        ให้ตัดสินแบบเข้มงวด นับว่า "ตรง" เฉพาะกรณีต่อไปนี้เท่านั้น
          1) เป็นสิ่งเดียวกัน ชื่อเรียกอื่น หรือตัวย่อ (เช่น "ReactJS" กับ "React", "K8s" กับ "Kubernetes")
          2) resume_skill เป็นผลิตภัณฑ์/ภาษา/เครื่องมือที่ "จัดอยู่ในประเภท" standard_skill โดยตรง
             (เช่น "PostgreSQL" กับ "Relational database management software", "Spring Data JPA" กับ "Spring Framework")
        ไม่นับว่าตรงถ้า
          - แค่อยู่ในสายงานเดียวกันหรือใช้ร่วมกันบ่อย (เช่น "HikariCP" กับ "Hibernate ORM", "JWT" กับ "Web application software")
          - แค่ชื่อบริษัทหรือคำบางคำซ้ำกัน (เช่น "Google OAuth" กับ "Google Cloud software")
          - เป็นหัวข้อความรู้ ไม่ใช่เครื่องมือ (เช่น "Computer Architecture" กับ "Microservices Architecture")
        ถ้าไม่แน่ใจให้ตอบไม่ตรง และให้ confidence ตามความมั่นใจจริง
        ตอบทุกคู่ตามลำดับ โดยคัดลอก resume_skill และ standard_skill กลับมาตรงตัว

        {pairs_text}
        """
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite-preview",
            contents=prompt,
            config={'response_mime_type': 'application/json', 'response_schema': SkillJudgeResponse},
        )
        return SkillJudgeResponse.model_validate_json(response.text)
    except Exception as e:
        logger.exception("Skill match judging failed")
        raise HTTPException(status_code=500, detail=f"AI Processing Error: {str(e)}")
