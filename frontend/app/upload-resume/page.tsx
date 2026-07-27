import type { Metadata } from "next";
import { ResumeUploadForm } from "@/components/resume/resume-upload-form";

export const metadata: Metadata = {
  title: "อัปโหลดเรซูเม่",
};

export default function UploadResumePage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-[clamp(24px,6vw,48px)] dark:bg-black">
      <ResumeUploadForm />
    </div>
  );
}
