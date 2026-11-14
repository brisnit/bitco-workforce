import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DataGate } from "@/components/shared/data-gate";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataGate>
      <DashboardShell>{children}</DashboardShell>
    </DataGate>
  );
}
