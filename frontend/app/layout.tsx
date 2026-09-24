import type { Metadata } from "next";
import { Inter, Poppins, Noto_Sans_Thai } from "next/font/google";
import Script from "next/script";
import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/lib/auth-context";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/lib/theme-context";
// นำเข้าจาก theme-shared ไม่ใช่ theme-context — ไฟล์นั้นเป็น "use client"
// ทุก export จะกลายเป็น client reference เรียกจากฝั่งเซิร์ฟเวอร์ไม่ได้ (500)
import { THEME_COOKIE, DEFAULT_THEME, isTheme } from "@/lib/theme-shared";
import "./globals.css";
import { cn } from "@/lib/utils";

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

// Primary typeface app-wide (Thai + Latin subsets). Wired in as the first
// entry of --font-sans in app/globals.css and of the body font stack, so
// every page renders Thai with Noto Sans Thai instead of the OS fallback
// (Tahoma/Leelawadee on Windows). Inter stays as the Latin fallback.
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // อ่านธีมจาก cookie ตั้งแต่ฝั่งเซิร์ฟเวอร์ แล้วใส่ data-theme ลงใน HTML
  // ตั้งแต่ชุดแรกที่ส่งออกไป ฝั่งเซิร์ฟเวอร์กับฝั่งเบราว์เซอร์จึงตรงกันเป๊ะ
  // ไม่มี hydration mismatch (เดิมใช้ localStorage + สคริปต์ inline ซึ่ง
  // เซิร์ฟเวอร์อ่านไม่ได้ ทำให้ React ล้มทั้งหน้าด้วย error #418 แล้วกดสลับ
  // ธีมไม่ติด) และไม่กระพริบ เพราะธีมถูกต้องมาตั้งแต่ byte แรก
  // ดูคำอธิบายเต็มใน lib/theme-context.tsx
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get(THEME_COOKIE)?.value;
  const theme = isTheme(cookieTheme) ? cookieTheme : DEFAULT_THEME;

  return (
    <html
      lang="th"
      data-theme={theme}
      className={cn(
        "h-full",
        "antialiased",
        poppins.variable,
        inter.variable,
        "font-sans",
        notoSansThai.variable
      )}
    >
      <body className="min-h-full flex flex-col">
        {/* Google Identity Services — loaded once app-wide so both /login
            and /register can call window.google.accounts.id without each
            needing its own <script> tag. See lib/use-google-signin.ts. */}
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" id="google-identity-services" />
        <ThemeProvider initialTheme={theme}>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
