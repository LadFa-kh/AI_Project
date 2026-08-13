import type { Metadata } from "next";
import { AdminDashboardView } from "@/components/admin/admin-dashboard-view";
import { AdminGuard } from "@/components/admin/admin-guard";

export const metadata: Metadata = {
  title: "Admin dashboard",
};

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminDashboardView />
    </AdminGuard>
  );
}
