# -*- coding: utf-8 -*-
"""
สคริปต์ทดสอบส่วนต่อประสานของระบบอัตโนมัติ
วิธีใช้:  python api_test.py
ต้องมี:   pip install requests
ก่อนรัน:  ให้ระบบทำงานอยู่ (docker compose up -d) และแก้ค่าตั้งต้นด้านล่างให้ตรง
ผลลัพธ์:  พิมพ์ผลออกหน้าจอ และบันทึกไฟล์ test-result.csv สำหรับกรอกลงตารางที่ 4.1
"""
import requests, csv, sys, io, os

BASE = "http://localhost:8080/api/v1"
ADMIN = {"email": "แก้เป็นอีเมลผู้ดูแลระบบ", "password": "แก้เป็นรหัสผ่าน"}
STUDENT = {"email": "แก้เป็นอีเมลนักศึกษา", "password": "แก้เป็นรหัสผ่าน"}
RESUME_PDF = "ใส่เส้นทางไฟล์เรซูเม่ทดสอบ .pdf"

results = []
def rec(no, name, ok, detail):
    mark = "✓" if ok else "✗"
    results.append([no, name, 1, "%s %s" % (mark, detail)])
    print("%-4s %-52s %s %s" % (no, name[:52], mark, detail))

def sess(cred, label):
    s = requests.Session()
    try:
        r = s.post(BASE + "/auth/login", json=cred, timeout=15)
        ok = r.status_code == 200 and "accessToken" in s.cookies.get_dict().get("accessToken", "") + str(s.cookies.get_dict())
        return s, r
    except Exception as e:
        return None, e

def check(no, name, fn):
    try:
        ok, detail = fn()
        rec(no, name, ok, detail)
    except Exception as e:
        rec(no, name, False, "เกิดข้อผิดพลาด: %s" % str(e)[:60])

print("=" * 78)
print("เริ่มทดสอบระบบที่", BASE)
print("=" * 78)

st, r_login = sess(STUDENT, "student")
ad, r_admin = sess(ADMIN, "admin")

check(2, "การเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน",
      lambda: (r_login.status_code == 200, "รหัสสถานะ %s" % r_login.status_code))
check(4, "การตรวจสอบสถานะการเข้าสู่ระบบหลังรีเฟรชหน้า",
      lambda: (st.get(BASE + "/auth/me").status_code == 200, "GET /auth/me คืนค่า %s" % st.get(BASE + "/auth/me").status_code))
check(7, "การป้องกันหน้าเว็บสำหรับผู้ที่ยังไม่เข้าสู่ระบบ",
      lambda: (requests.get(BASE + "/matching/recommendations?resumeId=00000000-0000-0000-0000-000000000000").status_code in (401, 403),
               "เรียกโดยไม่เข้าสู่ระบบได้รหัส %s" % requests.get(BASE + "/matching/recommendations?resumeId=00000000-0000-0000-0000-000000000000").status_code))
check(8, "การป้องกันหน้าผู้ดูแลระบบจากผู้ใช้ทั่วไป",
      lambda: (st.get(BASE + "/admin/dashboard").status_code == 403, "บัญชีนักศึกษาเรียก /admin ได้รหัส %s" % st.get(BASE + "/admin/dashboard").status_code))
check(30, "การค้นหาทักษะจากฐานข้อมูล O*NET",
      lambda: (requests.get(BASE + "/skills/search", params={"query": "java"}).status_code == 200,
               "พบ %s รายการ" % len(requests.get(BASE + "/skills/search", params={"query": "java"}).json())))
check(29, "การแสดงรายการสถานประกอบการทั้งหมด",
      lambda: (requests.get(BASE + "/workplaces").status_code == 200,
               "พบ %s รายการ" % len(requests.get(BASE + "/workplaces").json())))
check(33, "การแสดงข้อมูลสรุปภาพรวมของระบบ",
      lambda: (ad.get(BASE + "/admin/dashboard").status_code == 200, "รหัสสถานะ %s" % ad.get(BASE + "/admin/dashboard").status_code))
check(34, "การแสดงรายชื่อผู้ใช้ทั้งหมด",
      lambda: (ad.get(BASE + "/admin/users").status_code == 200, "พบ %s บัญชี" % len(ad.get(BASE + "/admin/users").json())))
check(38, "การแสดงรายการเรซูเม่ทั้งหมด",
      lambda: (ad.get(BASE + "/admin/resumes").status_code == 200, "พบ %s ฉบับ" % len(ad.get(BASE + "/admin/resumes").json())))
check(41, "การแสดงรายการประกาศรับสมัครทั้งหมด",
      lambda: (ad.get(BASE + "/admin/jobs").status_code == 200, "พบ %s ประกาศ" % len(ad.get(BASE + "/admin/jobs").json())))

if os.path.exists(RESUME_PDF):
    def upload():
        with open(RESUME_PDF, "rb") as f:
            r = st.post(BASE + "/resumes/upload", files={"file": (os.path.basename(RESUME_PDF), f, "application/pdf")}, timeout=180)
        if r.status_code == 200:
            j = r.json()
            return True, "สกัดทักษะได้ %s รายการ สร้างคำถาม %s ข้อ" % (len(j.get("extractedSkills", [])), len(j.get("questions", [])))
        return False, "รหัสสถานะ %s" % r.status_code
    check(9, "การอัปโหลดไฟล์เรซูเม่", upload)
else:
    print("(ข้าม ข้อ 9-14: ยังไม่ได้ตั้งค่า RESUME_PDF)")

check(5, "การออกจากระบบ",
      lambda: (st.post(BASE + "/auth/logout").status_code in (200, 204), "รหัสสถานะ %s" % st.post(BASE + "/auth/logout").status_code))

with io.open("test-result.csv", "w", encoding="utf-8-sig", newline="") as f:
    w = csv.writer(f); w.writerow(["ลำดับ", "รายการผลทดสอบ", "ครั้งที่", "ผลลัพธ์"]); w.writerows(results)

print("=" * 78)
print("ผ่าน %d จาก %d รายการ" % (sum(1 for r in results if "✓" in r[3]), len(results)))
print("บันทึกผลลงไฟล์ test-result.csv แล้ว")
