# sync-fe.ps1 — ดึงงานจาก GitHub มารวม แล้ว build container ให้อัตโนมัติ
#
# วิธีใช้: เปิด PowerShell ที่โฟลเดอร์โปรเจกต์ แล้วพิมพ์
#     .\sync-fe.ps1
#
# ถ้าไม่อยาก build ต่อ ให้ใส่ -NoBuild
#     .\sync-fe.ps1 -NoBuild
#
# สคริปต์นี้จะหยุดทันทีถ้าเจอ conflict หรือมีงานค้างที่ยังไม่ commit
# ไม่มีขั้นตอนไหนที่ลบงานของคุณทิ้งโดยไม่ถาม

param([switch]$NoBuild)

$ErrorActionPreference = "Stop"

function Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "  $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "  $msg" -ForegroundColor Yellow }
function Die($msg)  { Write-Host "`n!! $msg" -ForegroundColor Red; exit 1 }

# ---------------------------------------------------------------
Step "1/5 ตรวจงานค้าง"
# merge ทับงานที่ยังไม่ commit อาจทำให้งานหายได้ จึงต้องเคลียร์ก่อนเสมอ
$dirty = git status --porcelain
if ($dirty) {
    Write-Host $dirty
    Die "มีงานที่ยังไม่ commit อยู่ ให้ commit หรือ stash ก่อนแล้วค่อยรันใหม่`n   commit:  git add -A ; git commit -m ""ข้อความ""`n   stash :  git stash push -u -m ""wip"""
}
Ok "สะอาด ไม่มีงานค้าง"

# ---------------------------------------------------------------
Step "2/5 ดึงข้อมูลจาก GitHub"
git fetch origin
if ($LASTEXITCODE -ne 0) { Die "fetch ไม่สำเร็จ เช็คอินเทอร์เน็ตหรือสิทธิ์เข้าถึง repo" }

$behind = (git rev-list --count HEAD..origin/main).Trim()
if ($behind -eq "0") {
    Ok "ไม่มีอะไรใหม่ — ล่าสุดอยู่แล้ว"
    if (-not $NoBuild) { Warn "ข้ามการ build เพราะไม่มีอะไรเปลี่ยน" }
    exit 0
}
Ok "มี $behind commit ใหม่"
git log --oneline HEAD..origin/main

# ---------------------------------------------------------------
Step "3/5 ดูว่ากระทบส่วนไหน"
# ใช้ตัดสินว่าต้อง build service ไหนบ้าง จะได้ไม่ build ทั้งหมดโดยไม่จำเป็น
$changed = git diff --name-only HEAD...origin/main
$touchBackend  = ($changed | Where-Object { $_ -like "backend/*" }).Count -gt 0
$touchFrontend = ($changed | Where-Object { $_ -like "frontend/*" }).Count -gt 0
$touchPython   = ($changed | Where-Object { $_ -eq "main.py" -or $_ -eq "requirements.txt" }).Count -gt 0

if ($touchBackend)  { Ok "แตะ backend" }
if ($touchFrontend) { Ok "แตะ frontend" }
if ($touchPython)   { Ok "แตะ resume-service (Python)" }

# ---------------------------------------------------------------
Step "4/5 รวมงาน"
# -Xrenormalize -Xignore-all-space = ข้าม conflict ปลอมที่เกิดจาก
# ความต่างของ line ending (CRLF บน Windows vs LF บน Linux)
# จำเป็นจนกว่าทีมหน้าบ้านจะ pull commit .gitattributes ของเราไป
git merge --no-edit -Xrenormalize -Xignore-all-space origin/main
if ($LASTEXITCODE -ne 0) {
    $conflicts = git diff --name-only --diff-filter=U
    Write-Host ""
    Write-Host "ไฟล์ที่ชนกัน:" -ForegroundColor Yellow
    $conflicts | ForEach-Object { Write-Host "  $_" }
    Die "มี conflict ที่ต้องแก้เอง เปิดไฟล์ข้างบนแล้วหา <<<<<<< เพื่อเลือกว่าจะเอาฝั่งไหน`n   เสร็จแล้ว:  git add <ไฟล์> ; git commit`n   ยกเลิก   :  git merge --abort"
}
Ok "รวมสำเร็จ ไม่มี conflict"

# ---------------------------------------------------------------
Step "5/5 Build container"
if ($NoBuild) { Ok "ข้ามตามที่สั่ง (-NoBuild)"; exit 0 }

$services = @()
if ($touchFrontend) { $services += "frontend" }
if ($touchBackend)  { $services += "backend" }
if ($touchPython)   { $services += "resume-service" }

if ($services.Count -eq 0) {
    Ok "ไม่มีการเปลี่ยนแปลงที่ต้อง build"
    exit 0
}

Ok ("build: " + ($services -join ", "))
docker compose up -d --build @services
if ($LASTEXITCODE -ne 0) { Die "build ไม่ผ่าน อ่าน error ด้านบน" }

Write-Host "`nเสร็จแล้ว — เปิดเว็บด้วย Ctrl+Shift+R เพื่อล้าง cache เบราว์เซอร์" -ForegroundColor Green
