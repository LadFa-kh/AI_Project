import type { Metadata } from "next";
import { AccountSettingsPage } from "@/components/settings/account-settings-page";

export const metadata: Metadata = {
  title: "ตั้งค่าบัญชี — ResuMate",
};

export default function SettingsPage() {
  return <AccountSettingsPage />;
}
