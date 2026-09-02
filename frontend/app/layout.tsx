import type { Metadata } from "next";
import { Inter, Poppins, Geist, Noto_Sans_Thai } from "next/font/google";
import Script from "next/script";
import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/lib/auth-context";
import { cookies } from "next/headers";
import { ThemeProvider, THEME_COOKIE, isTheme } from "@/lib/theme-context";
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
  const theme = isTheme(cookieTheme) ? cookieTheme : "dark";

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
        geist.variable,
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
