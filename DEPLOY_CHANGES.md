# บันทึกการแก้ไข — เตรียมระบบขึ้น Production (CVFeedbackAI / ECP-P01)

เอกสารนี้สรุปการเปลี่ยนแปลงทั้งหมดในรอบนี้ ทั้งเหตุผล การเปรียบเทียบก่อน–หลัง
และรายละเอียดระดับไฟล์ เพื่อใช้อ้างอิงในการเขียน Logbook และเพื่อให้สามารถ
ย้อนรอย (Reverse Engineer) การเปลี่ยนแปลงได้ในภายหลัง

---

## ส่วนที่ 1 — ปัญหาตั้งต้นและการวินิจฉัย

### 1.1 อาการที่พบ

Console ของเบราว์เซอร์แสดง Error หลายรายการพร้อมกัน จึงต้องแยกว่าอันไหน
คือปัญหาจริง อันไหนเป็นสัญญาณรบกวน

| Error | ผลการวินิจฉัย |
|---|---|
| `GET /api/v1/auth/me` → 401 | **ปกติ** — เป็นสถานะ "ยังไม่ได้เข้าสู่ระบบ" ที่โค้ดออกแบบให้เกิดขึ้นได้ |
| `GET /api/v1/matching/recommendations` → 403 (ซ้ำ 6 ครั้ง) | **ปัญหาจริง** — Cookie ยืนยันตัวตนไม่ถูกส่งไปกับ Request |
| `forgot-password?_rsc=...` → 404 | **ปัญหาจริง** — มีลิงก์ไปยังหน้าที่ไม่มีอยู่ |
| `accounts.google.com/gsi/status` → 403 | **ปัญหาจริง** — Origin ยังไม่ได้ลงทะเบียนกับ Google |
| `Unchecked runtime.lastError`, `notification.js` | **ไม่เกี่ยวข้อง** — มาจากส่วนขยายของเบราว์เซอร์ |
| `preloaded but not used` | **ไม่เกี่ยวข้อง** — คำเตือนของ Next.js ไม่กระทบการทำงาน |
| `React error #418` | **ไม่กระทบ** — Hydration mismatch ไม่ทำให้ระบบใช้งานไม่ได้ |

### 1.2 ข้อค้นพบสำคัญ — คอมเมนต์ในโค้ดให้ข้อมูลที่ผิด

ในไฟล์ `auth-context.tsx`, `auth-service.ts`, `matching-service.ts`,
`resume-service.ts` มีคอมเมนต์ระบุตรงกันว่า

> "Backend's cookie is `SameSite=Lax` with no explicit `Domain=`, so a
> cross-site origin (like localhost:3000 during local dev) never receives
> or sends it at all."

**ข้อความนี้ไม่ถูกต้อง** หลักเกณฑ์ Same-site ของเบราว์เซอร์พิจารณาจาก
Registrable Domain เท่านั้น **ไม่นับหมายเลข Port** ดังนั้น
`http://localhost:3000` กับ `http://localhost:8080` จึงเป็น Same-site
และ Cookie แบบ `SameSite=Lax` ทำงานได้ตามปกติ

ความเข้าใจผิดนี้ทำให้ทีมเชื่อว่าต้อง Deploy ขึ้นโดเมนจริงก่อนจึงจะทดสอบ
ระบบยืนยันตัวตนได้ ซึ่งไม่จำเป็น

### 1.3 สาเหตุที่แท้จริงของ 403

การตรวจสอบไฟล์ตั้งค่าพบว่า **โค้ดทุกส่วนเขียนไว้ถูกต้องอยู่แล้ว**
(`CookieUtil`, `SecurityConfig`, `api-client.ts`) สาเหตุอยู่ที่การตั้งค่า
สภาพแวดล้อมและสถาปัตยกรรมการเรียก API ซึ่งเปราะบางโดยธรรมชาติ

| ประเด็น | รายละเอียด |
|---|---|
| ค่าที่ขัดแย้งกัน | `Caddyfile` ระบุว่า Cookie ใช้ `SameSite=None; Secure` แต่ `docker-compose.yml` ตั้ง `APP_COOKIE_SECURE=false` — หาก Container ยังไม่ถูก Recreate หลังแก้ไฟล์ Cookie จะยังติดธง `Secure` ซึ่งเบราว์เซอร์จะปฏิเสธการเก็บบน HTTP |
| การเข้าผ่าน LAN IP | `next.config.ts` มี `allowedDevOrigins: ['192.168.1.38']` หากเข้าเว็บผ่าน IP นี้ Origin จะไม่อยู่ใน CORS Allowlist และไม่เป็น Same-site กับ `localhost` |
| ไม่มีการตรวจสอบผลลัพธ์ | `setSession()` ตั้งสถานะผู้ใช้จาก Response Body โดยตรง โดยไม่ยืนยันว่าเบราว์เซอร์เก็บ Cookie สำเร็จจริง |

---

## ส่วนที่ 2 — การเปลี่ยนแปลงเชิงสถาปัตยกรรม

### 2.1 หลักการ — เปลี่ยนจาก Cross-origin เป็น Same-origin

นี่คือการเปลี่ยนแปลงที่สำคัญที่สุดในรอบนี้ และเป็นรากฐานของการแก้ไขอื่น ๆ

**สถาปัตยกรรมเดิม**

```
เบราว์เซอร์ ──► http://localhost:3000  (Next.js)
     │
     └────────► http://localhost:8080  (Spring Boot)   ◄── ข้าม Origin
                    ต้องพึ่ง CORS + Preflight + Cookie ข้าม Origin
```

**สถาปัตยกรรมใหม่**

```
เบราว์เซอร์ ──► https://app.recommendation.site  (Next.js)
                         │
                         │  /api/*  (Proxy ภายในเซิร์ฟเวอร์)
                         ▼
                    backend:8080  (Spring Boot)  ◄── เครือข่ายภายใน Docker
```

**ผลที่ได้**

| ประเด็น | เดิม | ใหม่ |
|---|---|---|
| CORS | ต้องตั้งค่า Allowlist และ `allowCredentials` | ไม่มี Cross-origin Request เหลืออยู่เลย |
| Preflight (OPTIONS) | เกิดขึ้นทุก Request ที่มี Header พิเศษ | ไม่เกิดขึ้น |
| SameSite | ต้องใช้ `None` เมื่อ Deploy คนละโดเมน | ใช้ `Lax` ได้ตลอด |
| Third-party Cookie | พึ่งพา ซึ่งเบราว์เซอร์กำลังทยอยยกเลิก | ไม่พึ่งพาเลย |
| Port ของ Backend | ต้องเปิดออกสู่อินเทอร์เน็ต | ไม่ต้องเปิดเลย |

### 2.2 ข้อควรระวังเชิงเทคนิค — ค่าถูกฝังตอน Build

`next.config.ts` ตั้งค่า `output: "standalone"` ซึ่งทำให้ Next.js
**ประเมินค่า `rewrites()` ตั้งแต่ตอน `next build`** แล้วบันทึกผลลัพธ์ลงไฟล์
`required-server-files.json` ไม่ได้อ่านค่าใหม่ตอน Runtime

ผลที่ตามมา: `BACKEND_INTERNAL_URL` **ต้องส่งเป็น Build Argument** ไม่ใช่
Environment Variable ตอนรัน และการแก้ไฟล์ `.env` ที่เกี่ยวข้องกับ
`NEXT_PUBLIC_*` หรือค่านี้ **ต้อง Build ใหม่เสมอ** (`--build`)
การสั่ง `restart` เพียงอย่างเดียวจะไม่มีผล

---

## ส่วนที่ 3 — รายละเอียดการแก้ไขรายไฟล์

### 3.1 `frontend/next.config.ts` — เพิ่ม API Proxy

**เดิม**

```ts
const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.38'],
  output: "standalone",
}
```

**ใหม่**

```ts
const BACKEND_INTERNAL_URL =
  process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.38"],
  output: "standalone",
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_INTERNAL_URL}/api/:path*` },
    ];
  },
};
```

**เหตุผล:** ทำให้ Request ทั้งหมดเป็น Same-origin ตามหลักการในข้อ 2.1

**หมายเหตุการออกแบบ:** ตั้งค่าเริ่มต้นเป็น `http://localhost:8080` เพื่อให้
การรัน `npm run dev` บนเครื่องพัฒนาใช้งานได้ทันทีโดยไม่ต้องตั้งค่าเพิ่ม
ส่วนตอนรันใน Docker จะถูก Override เป็น `http://backend:8080`

**การตรวจสอบความปลอดภัยของการเปลี่ยนแปลง:** ตรวจแล้วว่าไม่มีโฟลเดอร์
`frontend/app/api/` อยู่ในโปรเจกต์ จึงไม่ชนกับ Route Handler ที่มีอยู่เดิม

### 3.2 `frontend/frontend.Dockerfile` — เพิ่ม Build Argument

**เพิ่มก่อนบรรทัด `RUN npm run build`**

```dockerfile
ARG BACKEND_INTERNAL_URL=http://backend:8080
ENV BACKEND_INTERNAL_URL=${BACKEND_INTERNAL_URL}
```

**เหตุผล:** ตามข้อ 2.2 — ค่านี้ต้องมีอยู่ ณ เวลา Build ไม่ใช่เวลารัน

### 3.3 `docker-compose.yml` — ปรับเป็นโปรไฟล์ Development

| การเปลี่ยนแปลง | เดิม | ใหม่ | เหตุผล |
|---|---|---|---|
| Build args ของ frontend | `NEXT_PUBLIC_API_BASE_URL` เท่านั้น | เพิ่ม `BACKEND_INTERNAL_URL: http://backend:8080` และตั้ง Default ของ Base URL เป็น `/api/v1` | รองรับ Proxy |
| CORS | ไม่ได้กำหนดใน Compose | เพิ่ม `APP_CORS_ALLOWED_ORIGINS: http://localhost:3000` | ทำให้ค่าที่ใช้จริงเห็นได้ชัดเจน ไม่ซ่อนอยู่ในค่า Default ของโค้ด |
| Caddy | อยู่ในไฟล์นี้ | ย้ายออกไปยังไฟล์โปรไฟล์ Production | Caddy ไม่มีประโยชน์ตอนพัฒนา และเคยทำให้เข้าใจผิดว่าระบบต้องผ่าน Caddy เสมอ |
| Volume `caddy_data`, `caddy_config` | ประกาศไว้ในไฟล์นี้ | ย้ายไปพร้อม Caddy | ให้สอดคล้องกับ Service ที่ย้ายไป |

ค่า `APP_COOKIE_SECURE: "false"` และ `APP_COOKIE_SAME_SITE: Lax` **คงไว้เหมือนเดิม**
เพราะถูกต้องแล้วสำหรับการพัฒนาบน HTTP

### 3.4 `docker-compose.prod.yml` — ไฟล์ใหม่ (Override สำหรับเซิร์ฟเวอร์จริง)

ใช้สำหรับกรณี Deploy บนเครื่องที่มี IP สาธารณะ (เช่น VPS)

| Service | การตั้งค่า | เหตุผล |
|---|---|---|
| `postgres` | `ports: !override []` | ฐานข้อมูลไม่ควรเข้าถึงได้จากอินเทอร์เน็ต |
| `resume-service` | `ports: !override []` | เข้าถึงผ่าน Backend เท่านั้น |
| `backend` | `ports: !override []`, `APP_COOKIE_SECURE: "true"` | เข้าถึงผ่าน Proxy ของ Frontend เท่านั้น และ HTTPS แล้วจึงติดธง Secure ได้ |
| `frontend` | `ports: !override []` | เข้าผ่าน Caddy เท่านั้น |
| `caddy` | เปิด Port 80, 443 | ทางเข้าเดียวจากอินเทอร์เน็ต จัดการ HTTPS อัตโนมัติ |

**หมายเหตุ:** ไวยากรณ์ `!override []` ต้องใช้ Docker Compose v2.24 ขึ้นไป
(เครื่องที่ใช้พัฒนามี v5.0.2 จึงรองรับ) หากไม่ใช้ `!override` Compose จะ
**รวม** รายการ Port ของทั้งสองไฟล์เข้าด้วยกันแทนที่จะแทนที่

### 3.5 `docker-compose.tunnel.yml` — ไฟล์ใหม่ (Override สำหรับ Cloudflare Tunnel)

**นี่คือโปรไฟล์ที่ใช้จริงในการนำเสนอ** เนื่องจากรันบนโน้ตบุ๊กส่วนตัว

**เหตุผลที่ต้องใช้ Tunnel แทนการชี้ DNS ตรง**

| อุปสรรค | คำอธิบาย |
|---|---|
| IP ไม่คงที่ | IP ของอินเทอร์เน็ตบ้านเปลี่ยนทุกครั้งที่เราเตอร์เริ่มทำงานใหม่ |
| ต้อง Forward Port | ต้องตั้งค่าเราเตอร์เปิด Port 80/443 เข้ามาที่เครื่อง |
| CGNAT | ผู้ให้บริการอินเทอร์เน็ตในไทยส่วนใหญ่ใช้ IP ร่วมกันหลายบ้าน ทำให้**ไม่มี IP สาธารณะเป็นของตนเอง** และเปิดให้เข้าถึงจากภายนอกไม่ได้เลย |

Cloudflare Tunnel ทำงานกลับทิศ: `cloudflared` เปิดการเชื่อมต่อ **ขาออก**
ไปหา Cloudflare แล้ว Traffic ไหลย้อนกลับตามช่องทางนั้น จึงไม่ต้องมี IP
สาธารณะและไม่ต้องเปิด Port ใด ๆ

ความแตกต่างจากโปรไฟล์ `prod`: ไม่มี Caddy เพราะ Cloudflare รับหน้าที่
Terminate TLS ให้แล้ว และเพิ่ม Service `cloudflared`

```yaml
  cloudflared:
    image: cloudflare/cloudflared:latest
    restart: unless-stopped
    depends_on: [frontend]
    command: tunnel --no-autoupdate run --token ${CLOUDFLARE_TUNNEL_TOKEN}
```

### 3.6 `Caddyfile` — เขียนใหม่

| การเปลี่ยนแปลง | รายละเอียด |
|---|---|
| ลบคำอธิบายที่ล้าสมัย | เดิมระบุว่า Cookie ใช้ `SameSite=None; Secure` ซึ่งไม่ตรงกับสถานะปัจจุบัน |
| เพิ่ม `request_body max_size 12MB` | รองรับการอัปโหลดเรซูเม่ PDF ขนาดไม่เกิน 5MB โดยเผื่อ Overhead ของ Multipart และตัดคำขอที่ใหญ่ผิดปกติทิ้งตั้งแต่ต้นทาง |
| เพิ่ม `Strict-Transport-Security` | บังคับ HTTPS ฝั่งเบราว์เซอร์ จำเป็นเมื่อ Cookie ติดธง `Secure` |

### 3.7 `frontend/lib/auth-context.tsx` — แก้ช่องโหว่เชิงตรรกะ

**ปัญหา:** การได้รับ Response 200 จาก `/auth/login` **ไม่ได้แปลว่า**
เบราว์เซอร์เก็บ Cookie สำเร็จ (เช่น Cookie ติดธง `Secure` แต่วิ่งบน HTTP
หรือผู้ใช้ปิดการรับ Cookie) โค้ดเดิมตั้งสถานะผู้ใช้จาก Response Body ทันที
UI จึงเข้าใจว่าเข้าสู่ระบบสำเร็จแล้วยิง Endpoint ที่ต้องยืนยันตัวตนต่อไป
ได้ 403 ซ้ำ ๆ โดยผู้ใช้ไม่ทราบสาเหตุ — **นี่คือที่มาของ 403 จำนวน 6 ครั้ง
ใน Console**

**เดิม**

```ts
setSession: (session: AuthSession) => void;

const setSession = useCallback((session: AuthSession) => {
  const { accessToken, refreshToken, ...rest } = session;
  setUser(rest);
}, []);
```

**ใหม่**

```ts
setSession: (session: AuthSession) => Promise<void>;

const setSession = useCallback(async (session: AuthSession) => {
  const { accessToken, refreshToken, ...rest } = session;

  const confirmed = await getCurrentUser().catch(() => null);
  if (!confirmed) {
    setUser(null);
    throw new ApiError(401, "เข้าสู่ระบบสำเร็จ แต่เบราว์เซอร์ไม่ได้เก็บคุกกี้…", null);
  }
  setUser(confirmed ?? rest);
}, []);
```

**ผลกระทบต่อผู้เรียกใช้:** เปลี่ยน Signature เป็น `Promise<void>` จึงต้อง
เพิ่ม `await` ที่จุดเรียกใช้ทั้ง 4 จุด (`login-form.tsx` 2 จุด,
`register-form.tsx` 2 จุด) — หากไม่เพิ่ม ข้อผิดพลาดที่โยนออกมาจะกลายเป็น
Unhandled Rejection แทนที่จะถูกจับโดย `try/catch` ที่มีอยู่แล้ว

### 3.8 `frontend/components/auth/login-form.tsx` — ถอดลิงก์ที่ไม่มีปลายทาง

**เดิม**

```tsx
<div className={`${styles.helpRow} ...`}>
  <Link href="/forgot-password" className={styles.link}>ลืมรหัสผ่าน?</Link>
</div>
```

**ใหม่:** แทนที่ด้วยคอมเมนต์อธิบายเหตุผล และลบ `import Link from "next/link"`
ที่ไม่ได้ใช้แล้วออก (มิฉะนั้น ESLint จะทำให้ `npm run build` ล้มเหลว)

**เหตุผล:** ยังไม่มีทั้งหน้า `/forgot-password` และ Endpoint ฝั่ง Backend
ตัวลิงก์ทำให้ Next.js ทำ Prefetch ไปยัง Route ที่ไม่มีอยู่ จึงเกิด 404
ใน Console ทุกครั้งที่เปิดหน้าเข้าสู่ระบบ

### 3.9 ไฟล์ที่แก้เฉพาะคอมเมนต์

`api-client.ts`, `auth-service.ts`, `matching-service.ts`, `resume-service.ts`

ลบข้อความที่ระบุว่า "ใช้งานบน localhost ไม่ได้ ต้อง Deploy ที่
`app.recommendation.site` ก่อน" ออกทั้งหมด และแทนที่ด้วยคำอธิบาย
สถาปัตยกรรม Proxy แบบใหม่

**เหตุผล:** ข้อมูลเดิมไม่ถูกต้อง (ดูข้อ 1.2) และจะทำให้ผู้ที่มาอ่านโค้ด
ภายหลังเข้าใจผิดซ้ำอีก

### 3.10 `.env` และ `.env.example`

| ตัวแปร | เดิม | ใหม่ | เหตุผล |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8080/api/v1` | `/api/v1` | เป็น Path ล้วน ทำให้ยิงไปยัง Origin เดียวกับหน้าเว็บ |
| `APP_CORS_ALLOWED_ORIGINS` | ไม่มี | `http://localhost:3000` | เหลือไว้สำหรับการทดสอบผ่าน Swagger/Postman เท่านั้น |
| `COMPOSE_FILE` | ไม่มี | `docker-compose.yml;docker-compose.tunnel.yml` | ทำให้สั่ง `docker compose up -d --build` ได้ตามปกติโดยไม่ต้องพิมพ์ `-f` หลายตัว |
| `CLOUDFLARE_TUNNEL_TOKEN` | ไม่มี | *(ค่าจริง)* | ใช้โดย Service `cloudflared` |

**บทเรียนสำคัญ:** ตัวคั่นของ `COMPOSE_FILE` **ต่างกันตามระบบปฏิบัติการ** —
Windows ใช้ `;` ส่วน Linux/macOS ใช้ `:` เนื่องจากบน Windows เครื่องหมาย `:`
ถูกใช้เป็นตัวคั่นชื่อไดรฟ์อยู่แล้ว การใช้ `:` บน Windows ทำให้ Docker
ตีความทั้งข้อความเป็นชื่อไฟล์เดียวและรายงานว่าหาไฟล์ไม่พบ

---

## ส่วนที่ 4 — การตั้งค่าภายนอกโค้ด

### 4.1 Google Cloud Console

Authorized JavaScript origins ต้องมีครบ 3 รายการ

| Origin | ใช้เมื่อ |
|---|---|
| `http://localhost:3000` | การพัฒนา |
| `https://recommendation.site` | Backend / Swagger |
| `https://app.recommendation.site` | Frontend ที่ Deploy จริง |

**ข้อสังเกต:** Authorized redirect URIs และ Client Secret **ไม่จำเป็นต้องใช้**
สำหรับโปรเจกต์นี้ เพราะใช้ Google Identity Services แบบรับ ID Token
ในเบราว์เซอร์แล้วส่งให้ Backend ตรวจสอบ (`POST /auth/google`)
ไม่มีขั้นตอน Redirect กลับมายังเซิร์ฟเวอร์

### 4.2 Cloudflare Tunnel — Published Application Routes

ต้องอยู่ใน Tunnel **ตัวเดียวกัน** เพราะ `cloudflared` หนึ่ง Container
รันได้เพียงหนึ่ง Tunnel

| Hostname | Service |
|---|---|
| `app.recommendation.site` | `http://frontend:3000` |
| `recommendation.site` | `http://backend:8080` |

---

## ส่วนที่ 5 — ปัญหาที่พบระหว่างการตั้งค่า (เหมาะสำหรับหัวข้อ Blockers)

| ปัญหา | สาเหตุ | แนวทางแก้ไข |
|---|---|---|
| `Error 1033 Cloudflare Tunnel error` | DNS ของโดเมนยังชี้ไปยัง Tunnel เดิม แต่ Service `cloudflared` ถูกถอดออกจาก Compose ตอนรวมโค้ดรอบก่อน จึงไม่มีตัวรับปลายทาง | เพิ่ม Service `cloudflared` กลับเข้ามาในโปรไฟล์ Tunnel |
| `A DNS record with this name already exists` | ตอนลบ Public Hostname ทาง Cloudflare ลบเฉพาะ Route แต่ปล่อย CNAME Record ค้างไว้ในโซน DNS | ลบ CNAME ที่ปลายทางลงท้ายด้วย `.cfargotunnel.com` ทิ้งด้วยตนเอง แล้วเพิ่ม Route ใหม่ |
| `CreateFile ...docker-compose.yml:docker-compose.tunnel.yml` | ใช้ตัวคั่น `:` ใน `COMPOSE_FILE` บน Windows | เปลี่ยนเป็น `;` |
| `Unauthorized: Tunnel not found` | Token ใน `.env` เป็นของ Tunnel ที่ถูกลบไปแล้ว (`8e238ee5-…`) | นำ Token ของ Tunnel ที่มีอยู่จริงมาแทน (`40ec1ec5-…`) |
| Terminal ไม่คืน Prompt | สั่ง `docker compose logs -f` ซึ่งเกาะติด Log ไม่มีวันจบเอง | กด `Ctrl + C` หรือใช้ `--tail N` แทน `-f` |

---

## ส่วนที่ 6 — สรุปรายการไฟล์

### ไฟล์ที่เพิ่มใหม่

| ไฟล์ | หน้าที่ |
|---|---|
| `docker-compose.prod.yml` | โปรไฟล์ Production บนเซิร์ฟเวอร์ที่มี IP สาธารณะ (ใช้ Caddy) |
| `docker-compose.tunnel.yml` | โปรไฟล์ Production ผ่าน Cloudflare Tunnel (ใช้จริง) |

### ไฟล์ที่แก้ไข

| ไฟล์ | ประเภทการแก้ไข |
|---|---|
| `frontend/next.config.ts` | เพิ่ม `rewrites()` — **การเปลี่ยนแปลงหลัก** |
| `frontend/frontend.Dockerfile` | เพิ่ม `ARG BACKEND_INTERNAL_URL` |
| `frontend/lib/auth-context.tsx` | `setSession` เป็น async + ยืนยันด้วย `/auth/me` |
| `frontend/components/auth/login-form.tsx` | เพิ่ม `await`, ถอดลิงก์ลืมรหัสผ่าน, ลบ import ที่ไม่ใช้ |
| `frontend/components/auth/register-form.tsx` | เพิ่ม `await` |
| `frontend/lib/api-client.ts` | คอมเมนต์ |
| `frontend/lib/auth-service.ts` | คอมเมนต์ |
| `frontend/lib/matching-service.ts` | คอมเมนต์ |
| `frontend/lib/resume-service.ts` | คอมเมนต์ |
| `docker-compose.yml` | Build args, CORS, ย้าย Caddy ออก |
| `Caddyfile` | เขียนใหม่ |
| `.env`, `.env.example` | Base URL, CORS, `COMPOSE_FILE`, Tunnel Token |

### ไฟล์ที่ไม่ได้แตะเลย

**โค้ด Java ทั้งหมด** (`SecurityConfig.java`, `CookieUtil.java`,
`JwtAuthenticationFilter.java` และ Controller/Service ทุกตัว),
`main.py`, `requirements.txt`, `main-py.Dockerfile` และฐานข้อมูล

การเปลี่ยนแปลงทั้งหมดในรอบนี้จำกัดอยู่ที่ชั้น Configuration และ Frontend
เท่านั้น ซึ่งเป็นสิ่งยืนยันว่าตรรกะฝั่ง Backend ถูกต้องอยู่แล้วตั้งแต่ต้น

---

## ส่วนที่ 7 — วิธีใช้งาน

### การพัฒนา (เครื่องตนเอง)

ปล่อยบรรทัด `COMPOSE_FILE` ใน `.env` เป็นคอมเมนต์ไว้

```bash
docker compose up -d --build
```

เข้าใช้งานที่ `http://localhost:3000` และ Swagger ที่
`http://localhost:8080/swagger-ui/index.html`

### การนำขึ้นใช้งานจริง

เปิดใช้บรรทัดนี้ใน `.env`

```
COMPOSE_FILE=docker-compose.yml;docker-compose.tunnel.yml
```

```bash
docker compose up -d --build
docker compose logs --tail 30 cloudflared
```

ต้องเห็นข้อความ `Registered tunnel connection` จึงจะถือว่าเชื่อมต่อสำเร็จ
แล้วเข้าใช้งานที่ `https://app.recommendation.site`

### ข้อควรระวัง

1. **ต้องใช้ `--build` เสมอ** เมื่อแก้ค่า `NEXT_PUBLIC_*` หรือ
   `BACKEND_INTERNAL_URL` เพราะค่าเหล่านี้ถูกฝังตั้งแต่ตอน Build
2. **โน้ตบุ๊กต้องเปิดและเชื่อมต่ออินเทอร์เน็ตอยู่** ตลอดเวลาที่ต้องการให้
   เว็บเข้าถึงได้จากภายนอก — ควรตั้งค่าไม่ให้เครื่องเข้าสู่โหมด Sleep

---

## ส่วนที่ 8 — งานที่ยังเหลือ

| ลำดับ | รายการ | ความสำคัญ |
|---|---|---|
| 1 | เปลี่ยน `COMET_API_KEY` ใหม่ (เคยหลุดขึ้น Git Repository) | สูง |
| 2 | สร้าง Cloudflare Tunnel Token ใหม่ | ปานกลาง |
| 3 | เปลี่ยน `JWT_SECRET` จากค่าตัวอย่างเป็นค่าสุ่มจริง | ปานกลาง |
| 4 | ทำฟีเจอร์รีเซ็ตรหัสผ่าน แล้วนำลิงก์ในหน้า Login กลับมา | ต่ำ |
| 5 | แก้ Hydration Mismatch ที่ทำให้เกิด React Error #418 | ต่ำ |
| 6 | ข้อจำกัดเดิมที่ยังไม่ได้แก้ — Refresh Token เพิกถอนไม่ได้, การเรียก External API อยู่ใน Transaction เดียวกับการบันทึก, Endpoint ประเภท List ไม่มีการแบ่งหน้า | ตามแผนเดิม |

---

## ส่วนที่ 9 — บทเรียนที่ได้ (เหมาะสำหรับหัวข้อสรุป)

1. **คอมเมนต์ที่ผิดอันตรายกว่าไม่มีคอมเมนต์** — คำอธิบายเรื่อง Same-site
   ที่คลาดเคลื่อนทำให้ทีมเชื่อว่าต้อง Deploy ก่อนจึงจะทดสอบได้ ทั้งที่
   ทดสอบบนเครื่องตนเองได้มาตลอด

2. **แยกโปรไฟล์ตามสภาพแวดล้อมตั้งแต่ต้น** — ค่าอย่าง `APP_COOKIE_SECURE`
   ต้องเป็นค่าตรงข้ามกันระหว่าง Development กับ Production การเก็บไว้ใน
   ไฟล์เดียวแล้วคอยแก้กลับไปมาเป็นสาเหตุของความผิดพลาดที่หาสาเหตุยาก

3. **ตัดปัญหาที่ต้นเหตุดีกว่าแก้ทีละอาการ** — การเปลี่ยนมาใช้ Proxy ทำให้
   ปัญหา CORS, Preflight, และ Third-party Cookie หายไปพร้อมกันทั้งหมด
   แทนที่จะต้องตั้งค่าแก้ทีละจุด

4. **Response ที่สำเร็จไม่ได้แปลว่าผลข้างเคียงสำเร็จ** — HTTP 200 จาก
   `/auth/login` ไม่ได้รับประกันว่าเบราว์เซอร์เก็บ Cookie ได้จริง
   ระบบควรยืนยันผลลัพธ์ที่ต้องการจริง ๆ ไม่ใช่เชื่อสถานะของ Response

5. **พฤติกรรมที่ต่างกันตามระบบปฏิบัติการต้องบันทึกไว้เสมอ** — ตัวคั่น
   `COMPOSE_FILE` เป็นตัวอย่างเดียวกับปัญหา Encoding ของ PowerShell
   ที่เคยพบในรอบก่อน
