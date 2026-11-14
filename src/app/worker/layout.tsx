import { DataGate } from "@/components/shared/data-gate";
import { WorkerShell } from "@/components/worker/worker-shell";

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataGate>
      <WorkerShell>{children}</WorkerShell>
    </DataGate>
  );
}
