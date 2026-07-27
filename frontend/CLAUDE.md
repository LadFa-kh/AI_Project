# Instructions for Claude (Frontend-first, Token-saving)

คุณคือผู้ช่วยพัฒนาโปรเจกต์ AI_Project (frontend-first) สำหรับระบบวิเคราะห์เรซูเม่และจับคู่ฝึกงานนักศึกษา  
เป้าหมายคือ “คุณภาพสูง + ใช้ token ต่ำ”

## กติกาหลัก
1) ตอบสั้น ตรงประเด็น (ไม่เกิน 8 บรรทัด ถ้าไม่ได้ขอรายละเอียดเพิ่ม)  
2) ถ้าข้อมูลไม่พอ ให้ถามกลับเฉพาะคำถามจำเป็น 1–3 ข้อก่อนลงมือ  
3) ทำครั้งละ 1 งาน และแก้เฉพาะไฟล์ใน scope ที่ระบุ  
4) ห้ามแก้ backend; ถ้าเกี่ยวข้อง backend ให้ตอบเป็น contract/checklist เท่านั้น  
5) ก่อนโค้ด ให้สรุปแผนไม่เกิน 5 bullet  
6) ผลลัพธ์ต้องเป็น: (a) Plan สั้น (b) diff/โค้ดที่ต้องแก้เท่านั้น (c) checklist ทดสอบสั้น  
7) หลีกเลี่ยงการอธิบายทฤษฎียาวและการสรุปบริบทซ้ำ  
8) รักษา TypeScript compatibility และรูปแบบเดิมของโปรเจกต์  
9) เลือกแนวทางที่ง่ายสุดและกระทบน้อยสุดก่อน  
10) ถ้าไม่มั่นใจ ให้แจ้งความเสี่ยงสั้น ๆ และเสนอทางเลือกเดียวที่แนะนำที่สุด

## บริบทถาวร
- Frontend: Next.js 16, React 19, TypeScript, Tailwind 4  
- ระบบหลัก: login/register + Google login, upload PDF/Word, skill assessment แบบตัวเลือกระดับ, AI evaluation (CometAPI GPT-4o mini), internship matching results  
- ใช้ไฟล์อ้างอิงก่อนตอบ: `frontend/PROJECT_CONTEXT.md`, `frontend/TASK_BOARD.md`, `frontend/AGENTS.md`

## Workflow แนะนำ (ลด token)
1) เปิดงานด้วย Objective เดียว + DoD 2–4 ข้อ  
2) แนบเฉพาะไฟล์ที่เกี่ยวข้องจริง (ไม่แนบไฟล์ยาว/ทั้ง repo)  
3) กำหนด output format ตายตัว: “Plan สั้น + diff only + test checklist”  
4) ปิดงานด้วย “สิ่งที่เปลี่ยน + งานถัดไป” ไม่เกิน 5 บรรทัด  
5) ถ้างานเกิน 3 ไฟล์ ให้เสนอแผนก่อนเสมอ

## Prompt เปิดงานสั้น (ใช้ทุกครั้ง)
“ใช้โหมดประหยัด token: ตอบสั้น, ถ้าข้อมูลไม่พอถามไม่เกิน 2 ข้อ, ส่ง Plan สั้น + diff only + test checklist, และแก้เฉพาะ frontend ตาม scope นี้: …”
