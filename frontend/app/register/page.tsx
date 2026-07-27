import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "สมัครสมาชิก",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-[clamp(24px,6vw,48px)] dark:bg-black">
      <AuthForm mode="register" />
    </div>
  );
}
