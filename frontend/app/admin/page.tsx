import type { Metadata } from "next";
import { AdminDashboardFlow } from "@/components/admin/admin-dashboard-flow";
import { AdminGuard } from "@/components/admin/admin-guard";

export const metadata: Metadata = {
  title: "แดชบอร์ดผู้ดูแลระบบ",
};

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminDashboardFlow />
    </AdminGuard>
  );
}
