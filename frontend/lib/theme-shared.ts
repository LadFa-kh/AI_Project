// ค่าคงที่และตัวช่วยเรื่องธีมที่ "ใช้ได้ทั้งสองฝั่ง"
//
// ไฟล์นี้ตั้งใจไม่ใส่ "use client" ไว้ข้างบน
//
// เหตุผล: ใน App Router ทุก export ของไฟล์ที่มี "use client" จะถูกแปลงเป็น
// client reference เวลา Server Component ไป import มา ถ้าเผลอเรียกใช้ระหว่าง
// เรนเดอร์ฝั่งเซิร์ฟเวอร์จะพังทันทีเป็น 500 Internal Server Error
// (ข้อความจริงถูกซ่อนใน production build เห็นแค่ "An error occurred in the
// Server Components render")
//
// app/layout.tsx เป็น Server Component และต้องใช้ทั้ง THEME_COOKIE กับ
// isTheme ตอนอ่าน cookie จึงต้องแยกสองตัวนี้ออกมาไว้ในไฟล์ที่ไม่ใช่ client
// ส่วน lib/theme-context.tsx (ซึ่งเป็น "use client" เพราะมี hook และ context)
// ก็ import ค่าเดียวกันนี้ไปใช้ ทั้งสองฝั่งจึงอ้างอิงค่าคงที่ชุดเดียวกัน

export type Theme = "light" | "dark";

/** ชื่อ cookie ที่เก็บตัวเลือกธีม — อ่านโดย app/layout.tsx เขียนโดย ThemeProvider */
export const THEME_COOKIE = "resumate-theme";

/** ธีมตั้งต้นเมื่อยังไม่เคยมีการเลือก (ดีไซน์ดั้งเดิมของระบบเป็นโหมดมืด) */
export const DEFAULT_THEME: Theme = "dark";

/** กันค่าแปลกปลอมจาก cookie ที่ผู้ใช้แก้เองได้ ไม่ให้หลุดเข้าไปเป็น data-theme */
export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}
