import type { NextConfig } from "next";

// ---------------------------------------------------------------------------
// API proxy (same-origin auth)
//
// ทุก request ที่ frontend ยิงไป backend จะวิ่งผ่าน path `/api/*` ของ Next.js
// เอง แล้ว Next proxy ต่อไปยัง container `backend` ภายในเครือข่าย Docker
//
// ทำไมต้องทำแบบนี้:
//   1. เบราว์เซอร์เห็นว่าทุก request เป็น same-origin → ไม่มี CORS, ไม่มี
//      preflight (OPTIONS) ที่เคยทำให้ /skills/search พังมาก่อน
//   2. cookie `accessToken` เป็น host-only cookie บนโดเมนเดียวกับหน้าเว็บ
//      จึงใช้ `SameSite=Lax` ได้ตลอด ไม่ต้องพึ่ง `SameSite=None` ซึ่งนับเป็น
//      third-party cookie ที่ Chrome กำลังทยอยเลิกรองรับ
//   3. backend ไม่ต้องเปิด port ออกอินเทอร์เน็ตเลย (ดู docker-compose.prod.yml)
//
// ⚠️ ข้อควรระวัง: ด้วย `output: "standalone"` ค่า rewrites จะถูก evaluate
// ตอน `next build` แล้ว serialize ลง required-server-files.json ไม่ใช่อ่านใหม่
// ตอน runtime ดังนั้น BACKEND_INTERNAL_URL ต้องส่งเป็น build arg (ดู
// frontend.Dockerfile) ไม่ใช่แค่ environment ตอนรัน
// ---------------------------------------------------------------------------
// ค่า default เป็น localhost:8080 เพื่อให้ `npm run dev` บนเครื่องตัวเองใช้ได้ทันที
// ส่วนตอนรันใน Docker, compose จะส่ง build arg เป็น http://backend:8080 แทน
const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  // อนุญาตให้เข้าหน้า dev ผ่าน LAN IP ได้ (npm run dev บนเครื่องอื่นในวง)
  allowedDevOrigins: ["192.168.1.38"],

  // จำเป็นสำหรับ Docker build (frontend.Dockerfile): สร้าง .next/standalone
  // ที่มีเฉพาะไฟล์ที่ต้องใช้รัน `node server.js`
  output: "standalone",

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_INTERNAL_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
