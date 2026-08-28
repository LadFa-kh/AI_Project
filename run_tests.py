# -*- coding: utf-8 -*-
"""
สคริปต์ทดสอบระบบอัตโนมัติ — ครอบคลุม TC-01 ถึง TC-39 ของตารางในบทที่ 4
รันแล้วได้ไฟล์ test-result.csv ที่กรอกลงตารางได้ทันที

วิธีใช้
    pip install requests
    python run_tests.py

⚠️ สคริปต์นี้สร้างบัญชีทดสอบของตัวเองด้วยอีเมลสุ่ม และลบเฉพาะข้อมูลที่ตัวเองสร้าง
   ไม่แตะข้อมูลจริงของผู้ใช้รายอื่น
"""
import requests, csv, io, os, sys, time, uuid, json

# ═══════════ ตั้งค่าตรงนี้ก่อนรัน ═══════════
BASE        = "http://localhost:3000/api/v1"      # เรียกผ่าน proxy ของ Next.js
PUBLIC_BASE = "https://app.recommendation.site"   # โดเมนจริง สำหรับ TC-36 ถึง TC-39
ADMIN_EMAIL = "ratchaponsrichamnan@gmail.com"
ADMIN_PASS  = os.environ.get("ADMIN_PASS", "Ratchapon6878")
RESUME_PDF  = r"C:\Users\ratch\Downloads\Ratchapon_Srichamnan_CV_TH.pdf"
# ════════════════════════════════════════════

R = []                     # เก็บผลลัพธ์
def rec(code, ok, detail, attempt=1):
    R.append([code, attempt, detail, "ผ่าน" if ok else "ไม่ผ่าน"])
    print("%-7s %-8s %s" % (code, "ผ่าน" if ok else "ไม่ผ่าน", detail))

def run(code, fn):
    try:
        ok, detail = fn()
        rec(code, ok, detail)
        return ok
    except Exception as e:
        rec(code, False, "เกิดข้อผิดพลาดขณะทดสอบ: %s" % str(e)[:70])
        return False

def new_email(tag): return "test-%s-%s@example.com" % (tag, uuid.uuid4().hex[:8])
def envelope(r):
    """แกะ data ออกจาก ApiResponse โดยไม่พังเมื่อ data เป็น null"""
    try:
        j = r.json()
    except Exception:
        return {}
    if isinstance(j, dict) and "data" in j:
        return j["data"] if isinstance(j["data"], dict) else {}
    return j if isinstance(j, dict) else {}

def unsecure(sess):
    """ระบบตั้งคุกกี้เป็น Secure เมื่อรันโปรไฟล์ production ทำให้ไลบรารี requests
       ไม่ยอมส่งคุกกี้ผ่าน http เบราว์เซอร์ยกเว้นให้ localhost แต่ requests ไม่ยกเว้น
       จึงต้องปลดธงนี้หลังเข้าสู่ระบบ เพื่อให้ทดสอบผ่าน localhost ได้"""
    for c in sess.cookies:
        c.secure = False
    return sess

def check_auth(sess, label):
    r = sess.get(BASE+"/auth/me", timeout=20)
    if r.status_code != 200:
        print("   ⚠ %s : เรียก /auth/me ได้รหัส %d — การทดสอบที่ต้องยืนยันตัวตนจะไม่ผ่านทั้งหมด" % (label, r.status_code))
    return r.status_code == 200

def wait_ready(timeout=180):
    """รอจนกว่า backend จะพร้อมรับคำขอ ป้องกันการรันทดสอบขณะที่ container
       ยังรีสตาร์ทอยู่ ซึ่งจะทำให้ทุกกรณีได้รหัสสถานะ 500 โดยไม่เกี่ยวกับตรรกะของระบบ"""
    print("กำลังรอให้ระบบพร้อมใช้งาน ...", end="", flush=True)
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get(BASE+"/workplaces", timeout=10)
            if r.status_code == 200:
                print(" พร้อมแล้ว (ใช้เวลา %d วินาที)" % int(time.time()-start))
                return True
        except Exception:
            pass
        print(".", end="", flush=True)
        time.sleep(3)
    print("\n⚠ ระบบยังไม่พร้อมหลังรอ %d วินาที — ตรวจสอบด้วย docker compose ps" % timeout)
    return False

print("="*82); print("เริ่มทดสอบระบบที่", BASE); print("="*82)
if not wait_ready():
    sys.exit(1)

# ─────────── หมวด 1 : ระบบสมาชิกและการยืนยันตัวตน ───────────
S_EMAIL, S_PASS = new_email("student"), "Test@12345"
s = requests.Session()

def tc01():
    r = s.post(BASE+"/auth/register", json={"email":S_EMAIL,"password":S_PASS,"fullname":"ผู้ใช้ทดสอบ หนึ่ง"}, timeout=20)
    unsecure(s)
    got = "accessToken" in s.cookies.get_dict()
    return r.status_code in (200,201), "สมัครสำเร็จ รหัสสถานะ %d %s" % (r.status_code, "และได้รับคุกกี้ยืนยันตัวตน" if got else "แต่ไม่ได้รับคุกกี้")
run("TC-01", tc01)

def tc02():
    r = requests.post(BASE+"/auth/register", json={"email":S_EMAIL,"password":S_PASS,"fullname":"ซ้ำ"}, timeout=20)
    msg = ""
    try: msg = r.json().get("message","")
    except Exception: pass
    return r.status_code >= 400, "ระบบปฏิเสธ รหัสสถานะ %d %s" % (r.status_code, ("ข้อความ: "+msg) if msg else "")
run("TC-02", tc02)

def tc03():
    # ใช้ค่าที่ไม่ซ้ำกับรอบก่อน เพื่อไม่ให้ถูกปฏิเสธด้วยเหตุผล "อีเมลนี้ถูกใช้งานแล้ว"
    # ซึ่งจะทำให้เข้าใจผิดว่าการตรวจสอบรูปแบบอีเมลทำงานแล้ว
    bad = "abc%s" % uuid.uuid4().hex[:8]
    r = requests.post(BASE+"/auth/register", json={"email":bad,"password":S_PASS,"fullname":"รูปแบบผิด"}, timeout=20)
    msg = ""
    try: msg = r.json().get("message","")
    except Exception: pass
    if r.status_code < 400:
        return False, "ระบบสร้างบัญชีสำเร็จ รหัสสถานะ %d ทั้งที่อีเมล %s ไม่ถูกรูปแบบ" % (r.status_code, bad)
    if "ถูกใช้งานแล้ว" in msg:
        return False, "ถูกปฏิเสธเพราะอีเมลซ้ำ ไม่ใช่เพราะรูปแบบผิด จึงยังสรุปไม่ได้"
    return True, "ระบบปฏิเสธรูปแบบอีเมลไม่ถูกต้อง รหัสสถานะ %d %s" % (r.status_code, ("ข้อความ: "+msg) if msg else "")
run("TC-03", tc03)

st = requests.Session()
def tc04():
    r = st.post(BASE+"/auth/login", json={"email":S_EMAIL,"password":S_PASS}, timeout=20)
    unsecure(st); check_auth(st, "บัญชีนักศึกษา")
    return r.status_code==200 and "accessToken" in st.cookies.get_dict(), \
           "เข้าสู่ระบบสำเร็จ รหัสสถานะ %d และได้รับคุกกี้" % r.status_code
run("TC-04", tc04)

run("TC-05", lambda: (
    requests.post(BASE+"/auth/login", json={"email":S_EMAIL,"password":"wrong-pass"}, timeout=20).status_code >= 400,
    "ระบบปฏิเสธรหัสผ่านที่ไม่ถูกต้อง รหัสสถานะ %d" % requests.post(BASE+"/auth/login", json={"email":S_EMAIL,"password":"wrong-pass"}, timeout=20).status_code))

rec("TC-06", None, "ต้องทดสอบด้วยตนเองผ่านหน้าเว็บ เนื่องจากต้องยืนยันตัวตนกับ Google")

def tc07():
    r = st.get(BASE+"/auth/me", timeout=20); d = envelope(r)
    if r.status_code != 200:
        return False, "เรียก /auth/me ได้รหัสสถานะ %d แปลว่าคุกกี้ไม่ถูกส่งไปกับคำขอ" % r.status_code
    return d.get("role") is not None, \
           "คงสถานะเข้าสู่ระบบ รหัสสถานะ %d บทบาท %s อีเมล %s" % (r.status_code, d.get("role"), d.get("email"))
run("TC-07", tc07)

# ─────────── หมวด 2 : ระบบวิเคราะห์เรซูเม่ ───────────
upload_json = {}
def tc10():
    global upload_json
    with open(RESUME_PDF,"rb") as f:
        r = st.post(BASE+"/resumes/upload", files={"file":(os.path.basename(RESUME_PDF), f, "application/pdf")}, timeout=300)
    if r.status_code != 200: return False, "อัปโหลดไม่สำเร็จ รหัสสถานะ %d" % r.status_code
    upload_json = envelope(r)
    sk = upload_json.get("extractedSkills") or []
    qs = upload_json.get("questions") or []
    return True, "สกัดทักษะได้ %d รายการ และสร้างคำถาม %d ข้อ" % (len(sk), len(qs))
has_pdf = os.path.exists(RESUME_PDF)
if has_pdf: run("TC-10", tc10)
else: rec("TC-10", False, "ยังไม่ได้ตั้งค่าเส้นทางไฟล์ RESUME_PDF")

def tc11():
    r = st.post(BASE+"/resumes/upload", files={"file":("test.png", b"\x89PNG\r\n\x1a\n"+b"0"*500, "image/png")}, timeout=60)
    return r.status_code >= 400, "ระบบปฏิเสธไฟล์ที่ไม่ใช่ PDF รหัสสถานะ %d" % r.status_code
run("TC-11", tc11)

rec("TC-12", None, "ต้องเตรียมไฟล์ PDF ที่เป็นภาพสแกนเพื่อทดสอบด้วยตนเอง")

def tc13():
    big = b"%PDF-1.4\n" + b"0"*(12*1024*1024)
    try:
        r = st.post(BASE+"/resumes/upload", files={"file":("big.pdf", big, "application/pdf")}, timeout=300)
        return r.status_code >= 400, "เซิร์ฟเวอร์ปฏิเสธไฟล์ขนาด 12 MB รหัสสถานะ %d" % r.status_code
    except requests.exceptions.RequestException as e:
        return True, "เซิร์ฟเวอร์ตัดการเชื่อมต่อขณะส่งไฟล์ขนาดใหญ่ (%s)" % type(e).__name__
run("TC-13", tc13)

run("TC-14", lambda: (
    requests.post(BASE+"/resumes/upload", files={"file":("x.pdf", b"%PDF-1.4", "application/pdf")}, timeout=60).status_code in (401,403),
    "ระบบปฏิเสธผู้ที่ยังไม่เข้าสู่ระบบ รหัสสถานะ %d" % requests.post(BASE+"/resumes/upload", files={"file":("x.pdf", b"%PDF-1.4", "application/pdf")}, timeout=60).status_code))

def tc15():
    qs = upload_json.get("questions") or []
    if not qs: return False, "ไม่มีข้อมูลคำถาม เนื่องจาก TC-10 ไม่สำเร็จ"
    opts_ok = all(len(q.get("options",[]))==4 for q in qs)
    return len(qs) <= 5 and opts_ok, "สร้างคำถาม %d ข้อ แต่ละข้อมีตัวเลือก 4 ระดับ" % len(qs)
run("TC-15", tc15)

# ─────────── หมวด 3 : แบบประเมินและการคำนวณคะแนน ───────────
RESUME_ID = upload_json.get("resumeId")
QS = upload_json.get("questions") or []

def submit(answers, role=None):
    body = {"resumeId": RESUME_ID, "answers": answers}
    if role: body["desiredRoleName"] = role
    return st.post(BASE+"/assessments/submit", json=body, timeout=300)

def tc17():
    if not QS: return False, "ไม่มีข้อมูลคำถาม"
    r = submit([{"questionId":QS[0]["id"], "selectedScore":4}])
    return r.status_code >= 400, "ระบบปฏิเสธเมื่อตอบไม่ครบ รหัสสถานะ %d" % r.status_code
run("TC-17", tc17)

def tc18():
    if not QS: return False, "ไม่มีข้อมูลคำถาม"
    r = submit([{"questionId":q["id"], "selectedScore":5} for q in QS])
    return r.status_code >= 400, "ระบบปฏิเสธคะแนนนอกช่วง 1 ถึง 4 รหัสสถานะ %d" % r.status_code
run("TC-18", tc18)

def tc19():
    if not QS: return False, "ไม่มีข้อมูลคำถาม"
    fake = [{"questionId": str(uuid.uuid4()), "selectedScore":3} for _ in QS]
    r = submit(fake)
    return r.status_code >= 400, "ระบบปฏิเสธ questionId ที่ไม่ใช่ของเรซูเม่นี้ รหัสสถานะ %d" % r.status_code
run("TC-19", tc19)

result_json = {}
def tc16():
    global result_json
    if not QS: return False, "ไม่มีข้อมูลคำถาม"
    r = submit([{"questionId":q["id"], "selectedScore":4} for q in QS], role="Software Developers")
    if r.status_code != 200: return False, "ส่งแบบประเมินไม่สำเร็จ รหัสสถานะ %d" % r.status_code
    result_json = envelope(r)
    return True, "บันทึกคำตอบและคำนวณคะแนนสำเร็จ รหัสสถานะ 200"
run("TC-16", tc16)

def num(k):
    v = result_json.get(k)
    try: return float(v)
    except Exception: return None

run("TC-20", lambda: (num("assessmentScore")==100.0,
    "ตอบระดับ 4 ทุกข้อ ได้คะแนนแบบประเมิน %s" % result_json.get("assessmentScore")))

def tc21():
    rs, asc, fs = num("resumeScore"), num("assessmentScore"), num("finalScore")
    if None in (rs, asc, fs): return False, "ไม่พบค่าคะแนนในผลลัพธ์"
    expect = round(rs*0.6 + asc*0.4, 2)
    return abs(expect-fs) < 0.01, "คะแนนเรซูเม่ %.2f คะแนนแบบประเมิน %.2f คำนวณได้ %.2f ระบบให้ %.2f" % (rs, asc, expect, fs)
run("TC-21", tc21)

# ─────────── หมวด 4 : ระบบจับคู่ ───────────
matches = []
def tc23():
    global matches
    r = st.get(BASE+"/matching/recommendations", params={"resumeId":RESUME_ID}, timeout=120)
    if r.status_code != 200: return False, "เรียกผลการจับคู่ไม่สำเร็จ รหัสสถานะ %d" % r.status_code
    matches = r.json()
    return len(matches) <= 5, "ได้ผลการจับคู่ %d รายการ ไม่เกิน 5 อันดับตามที่กำหนด" % len(matches)
run("TC-23", tc23)

def tc25():
    if not matches: return False, "ไม่มีผลการจับคู่"
    m = matches[0]
    return ("matchedSkills" in m and "missingSkills" in m), \
        "อันดับที่ 1 คือ %s แสดงทักษะที่ตรง %d รายการ และที่ยังขาด %d รายการ" % (
        m.get("companyName"), len(m.get("matchedSkills",[])), len(m.get("missingSkills",[])))
run("TC-25", tc25)

run("TC-26", lambda: (
    st.get(BASE+"/matching/recommendations", params={"resumeId":str(uuid.uuid4())}, timeout=60).status_code >= 400,
    "ระบบปฏิเสธการเรียกดูเรซูเม่ที่ไม่ใช่ของตนเอง รหัสสถานะ %d" % st.get(BASE+"/matching/recommendations", params={"resumeId":str(uuid.uuid4())}, timeout=60).status_code))

rec("TC-27", None, "ต้องทดสอบด้วยตนเองผ่านหน้าเว็บ เนื่องจากเป็นการกรองฝั่งผู้ใช้")

def tc28():
    r = requests.get(BASE+"/workplaces", timeout=60)
    if r.status_code != 200 or not r.json(): return False, "เรียกรายการสถานประกอบการไม่สำเร็จ"
    jid = r.json()[0].get("id") or r.json()[0].get("jobId")
    r2 = requests.get(BASE+"/workplaces/%s" % jid, timeout=60)
    return r2.status_code==200, "เรียกรายละเอียดตำแหน่งงานสำเร็จ รหัสสถานะ %d" % r2.status_code
run("TC-28", tc28)

# ─────────── หมวด 5 : ผู้ดูแลระบบและความปลอดภัย ───────────
ad = requests.Session()
admin_ok = False
try:
    ra = ad.post(BASE+"/auth/login", json={"email":ADMIN_EMAIL,"password":ADMIN_PASS}, timeout=20)
    unsecure(ad); check_auth(ad, "บัญชีผู้ดูแลระบบ")
    admin_ok = ra.status_code == 200
except Exception:
    pass

if admin_ok:
    run("TC-29", lambda: (ad.get(BASE+"/admin/dashboard", timeout=60).status_code==200,
        "ผู้ดูแลระบบเข้าถึงหน้าสรุปภาพรวมได้ รหัสสถานะ %d" % ad.get(BASE+"/admin/dashboard", timeout=60).status_code))
    run("TC-30", lambda: (st.get(BASE+"/admin/dashboard", timeout=60).status_code==403,
        "บัญชีนักศึกษาถูกปฏิเสธ รหัสสถานะ %d" % st.get(BASE+"/admin/dashboard", timeout=60).status_code))

    def find_me():
        r = ad.get(BASE+"/admin/users", timeout=60)
        for u in (r.json() if r.status_code==200 else []):
            if u.get("email")==S_EMAIL: return u.get("userId") or u.get("id")
        return None
    TEST_UID = find_me()

    def tc31():
        if not TEST_UID: return False, "ไม่พบบัญชีทดสอบในรายการผู้ใช้"
        r = ad.put(BASE+"/admin/users/%s" % TEST_UID, json={"fullname":"ผู้ใช้ทดสอบ แก้ไขแล้ว"}, timeout=60)
        body = r.text.lower()
        return r.status_code==200 and "password" not in body, \
            "แก้ไขข้อมูลสำเร็จ รหัสสถานะ %d และไม่มีรหัสผ่านในผลลัพธ์" % r.status_code
    run("TC-31", tc31)

    def tc32():
        me = envelope(ad.get(BASE+"/auth/me", timeout=20)).get("userId")
        r = ad.delete(BASE+"/admin/users/%s" % me, timeout=60)
        return r.status_code >= 400, "ระบบปฏิเสธการลบบัญชีตนเอง รหัสสถานะ %d" % r.status_code
    run("TC-32", tc32)

    def tc33():
        if not TEST_UID: return False, "ไม่พบบัญชีทดสอบ"
        r = ad.delete(BASE+"/admin/users/%s" % TEST_UID, timeout=60)
        return r.status_code >= 400, "ระบบปฏิเสธการลบผู้ใช้ที่มีเรซูเม่ผูกอยู่ รหัสสถานะ %d" % r.status_code
    run("TC-33", tc33)

    def tc34():
        r = ad.post(BASE+"/admin/jobs", json={"companyName":"บริษัททดสอบ","positionName":"ตำแหน่งทดสอบ",
             "requiredSkills":"ทักษะที่ไม่มีอยู่จริงในฐานข้อมูล","jobType":"Internship"}, timeout=60)
        return r.status_code >= 400, "ระบบปฏิเสธทักษะที่ไม่มีในฐานข้อมูล รหัสสถานะ %d" % r.status_code
    run("TC-34", tc34)

    def tc35():
        r = ad.delete(BASE+"/admin/resumes/%s" % RESUME_ID, timeout=120)
        return r.status_code in (200,204), "ลบเรซูเม่พร้อมข้อมูลลูกสำเร็จ รหัสสถานะ %d" % r.status_code
    run("TC-35", tc35)

    def tc24():
        with open(RESUME_PDF,"rb") as f:
            r = st.post(BASE+"/resumes/upload", files={"file":(os.path.basename(RESUME_PDF), f, "application/pdf")}, timeout=300)
        if r.status_code != 200: return False, "อัปโหลดเรซูเม่ใหม่ไม่สำเร็จ"
        rid = envelope(r).get("resumeId")
        r2 = st.get(BASE+"/matching/recommendations", params={"resumeId":rid}, timeout=60)
        return r2.status_code >= 400, "ระบบปฏิเสธการจับคู่ก่อนทำแบบประเมิน รหัสสถานะ %d" % r2.status_code
    if has_pdf: run("TC-24", tc24)
else:
    for c in ["TC-29","TC-30","TC-31","TC-32","TC-33","TC-34","TC-35","TC-24"]:
        rec(c, False, "เข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบไม่สำเร็จ ตรวจสอบ ADMIN_EMAIL และ ADMIN_PASS")

run("TC-08", lambda: (st.post(BASE+"/auth/logout", timeout=20).status_code in (200,204),
    "ออกจากระบบสำเร็จ รหัสสถานะ %d" % st.post(BASE+"/auth/logout", timeout=20).status_code))
rec("TC-09", None, "ต้องรอเกิน 15 นาทีแล้วเรียกใช้งานซ้ำ จึงทดสอบด้วยตนเอง")
rec("TC-22", None, "ทดสอบด้วยตนเองโดยเว้นช่องสายงานที่สนใจไว้ว่างในหน้าเว็บ")

# ─────────── หมวด 6 : การใช้งานผ่านโดเมนจริง ───────────
def tc36():
    r = requests.get(PUBLIC_BASE, timeout=40)
    return r.status_code==200 and r.url.startswith("https://"), \
        "เข้าถึง %s ได้ รหัสสถานะ %d ผ่านการเชื่อมต่อที่เข้ารหัส" % (PUBLIC_BASE, r.status_code)
run("TC-36", tc36)

def tc37():
    import ssl, socket
    from urllib.parse import urlparse
    host = urlparse(PUBLIC_BASE).hostname
    ctx = ssl.create_default_context()
    with socket.create_connection((host,443), timeout=20) as sock:
        with ctx.wrap_socket(sock, server_hostname=host) as ss:
            cert = ss.getpeercert()
    issuer = dict(x[0] for x in cert['issuer']).get('organizationName','ไม่ทราบ')
    return True, "ใบรับรองถูกต้อง ออกโดย %s หมดอายุ %s" % (issuer, cert.get('notAfter'))
run("TC-37", tc37)

def tc38():
    p = requests.Session()
    r = p.post(PUBLIC_BASE+"/api/v1/auth/login", json={"email":ADMIN_EMAIL,"password":ADMIN_PASS}, timeout=40)
    ck = p.cookies.get_dict()
    return r.status_code==200 and "accessToken" in ck, \
        "เข้าสู่ระบบผ่านโดเมนจริงสำเร็จ รหัสสถานะ %d และจัดเก็บคุกกี้ได้" % r.status_code
run("TC-38", tc38)
rec("TC-39", None, "ทดสอบอัปโหลดผ่านหน้าเว็บโดเมนจริงด้วยตนเอง")

# ─────────── สรุปผล ───────────
with io.open("test-result.csv","w",encoding="utf-8-sig",newline="") as f:
    w = csv.writer(f); w.writerow(["รหัส","ครั้งที่","ผลลัพธ์ที่ได้","สรุปผล"]); w.writerows(sorted(R))
p = sum(1 for r in R if r[3]=="ผ่าน"); fl = sum(1 for r in R if r[3]=="ไม่ผ่าน")
print("="*82)
print("ผ่าน %d | ไม่ผ่าน %d | ต้องทดสอบเอง %d" % (p, fl, len(R)-p-fl))
print("บันทึกผลลงไฟล์ test-result.csv เรียบร้อย")
