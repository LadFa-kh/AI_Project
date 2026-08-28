import type { Metadata } from "next";
import { Inter, Poppins, Geist, Noto_Sans_Thai } from "next/font/google";
import Script from "next/script";
import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/lib/auth-context";
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
  title: "AI_Project — วิเคราะห์เรซูเม่ จับคู่ฝึกงาน",
  description: "แพลตฟอร์มวิเคราะห์เรซูเม่และจับคู่ตำแหน่งฝึกงานด้วย AI สำหรับนักศึกษา",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
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
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
