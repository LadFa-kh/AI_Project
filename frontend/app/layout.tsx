import type { Metadata } from "next";
import { Inter, Poppins, Geist, Noto_Sans_Thai } from "next/font/google";
import Script from "next/script";
import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/lib/theme-context";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-poppins",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
});

// Thai subset was missing entirely before — every Thai character in the UI
// was falling back to whatever Thai font the OS/browser defaults to
// (Tahoma/Leelawadee on Windows), which reads as visually inconsistent
// next to the Latin Inter/Poppins/Geist text. Paired with those as the
// primary Thai typeface across upload-resume, skill-assessment, and
// evaluation-result (see each page's module.css font-family stacks).
const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-noto-thai",
});

export const metadata: Metadata = {
  title: "ResuMate — วิเคราะห์เรซูเม่ จับคู่ฝึกงาน",
  description: "แพลตฟอร์มวิเคราะห์เรซูเม่และจับคู่ตำแหน่งฝึกงานด้วย AI สำหรับนักศึกษา",
  // favicon.ico in this same app/ folder is auto-detected by Next's
  // file convention. apple-touch-icon.png / icon-192.png / icon-512.png
  // live in public/ under non-convention names, so they need to be listed
  // explicitly here or browsers/iOS/Android never pick them up.
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // suppressHydrationWarning บน <html> ด้านล่าง: THEME_INIT_SCRIPT เขียน
  // data-theme ลงบน <html> ก่อน React hydrate ฝั่งเซิร์ฟเวอร์จึงเรนเดอร์
  // <html> โดยไม่มี attribute นี้เสมอ แล้วไม่ตรงกับฝั่ง client ทำให้ React
  // เตือน hydration mismatch ทุกครั้งที่โหลดหน้า ความไม่ตรงกันตรงนี้เป็น
  // ความตั้งใจ (จำเป็นเพื่อกันจอกระพริบผิดธีมก่อน ThemeProvider จะ mount)
  // จึงบอก React ให้ข้ามการเทียบ attribute ของ element นี้ตัวเดียว —
  // ไม่กระทบ element อื่น และไม่ได้ปิดการตรวจ hydration ของทั้งแอป
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        poppins.variable,
        inter.variable,
        "font-sans",
        geist.variable,
        notoSansThai.variable
      )}
    >
      <head>
        {/* ต้องอยู่ใน <head> เท่านั้น — สคริปต์นี้เขียน data-theme ลงบน <html>
            ให้เสร็จก่อนเบราว์เซอร์เริ่ม parse <body> จอแรกจึงเป็นธีมที่ถูก
            ไม่กระพริบ ถ้าย้ายไปไว้ใน <body> (จุดเดิม) มันจะทำงานหลัง <html>
            ถูก parse ไปแล้ว ทำให้ DOM ไม่ตรงกับ HTML ที่ server ส่งมา แล้ว
            hydration ของ React ล้มทั้งหน้า (error #418) — อาการคือกดสลับธีม
            แล้วสีไม่เปลี่ยน เพราะ DOM ค้างอยู่ที่สภาพเดิมจากฝั่ง server */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        {/* Google Identity Services — loaded once app-wide so both /login
            and /register can call window.google.accounts.id without each
            needing its own <script> tag. See lib/use-google-signin.ts. */}
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" id="google-identity-services" />
        <ThemeProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
