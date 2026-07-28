import type { Metadata } from "next";
import { UploadResumeFlow } from "@/components/resume/upload-resume-flow";

export const metadata: Metadata = {
  title: "อัปโหลดเรซูเม่",
};

export default function UploadResumePage() {
  return <UploadResumeFlow />;
}
