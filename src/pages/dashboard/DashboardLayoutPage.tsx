import { Outlet } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function DashboardLayoutPage() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
