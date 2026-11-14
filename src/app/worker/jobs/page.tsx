"use client";

import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import type { WorkOrder } from "@/lib/domain/types";
import { useData } from "@/lib/store/app-store";
import { currentEmployee, workOrdersForEmployee } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { WorkerJobCard } from "@/components/worker/job-card";
import { ProgressSheet } from "@/components/worker/progress-sheet";
import { ProblemSheet } from "@/components/worker/problem-sheet";

export default function WorkerJobsPage() {
  const data = useData();
  const me = currentEmployee(data);
  const [tab, setTab] = useState<"open" | "done">("open");
  const [updating, setUpdating] = useState<WorkOrder | null>(null);
  const [problemFor, setProblemFor] = useState<string | null | undefined>(undefined);
  const all = workOrdersForEmployee(data, me.id);
  const open = all.filter((w) => !["completed", "cancelled", "new"].includes(w.status));
  const done = all.filter((w) => w.status === "completed").sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
  const list = tab === "open" ? open : done;

  return (
    <div className="space-y-4 p-4 pb-8">
      <h1 className="font-display text-3xl font-black tracking-tight text-navy uppercase">My jobs</h1>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-steel-100 p-1">
        {(
          [
            ["open", `Open (${open.length})`],
            ["done", `Completed (${done.length})`],
          ] as const
        ).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("h-12 rounded-lg text-base font-bold", tab === k ? "bg-white text-navy shadow" : "text-steel-600")}>
            {l}
          </button>
        ))}
      </div>
      {list.length ? (
        <div className="space-y-4">
          {list.map((w) => (
            <WorkerJobCard key={w.id} data={data} wo={w} onUpdate={setUpdating} />
          ))}
        </div>
      ) : (
        <EmptyState icon={ClipboardCheck} title={tab === "open" ? "No open jobs" : "No completed jobs yet"} />
      )}
      <ProgressSheet
        wo={updating}
        onOpenChange={(o) => !o && setUpdating(null)}
        onReportProblem={() => {
          setProblemFor(updating?.id ?? null);
          setUpdating(null);
        }}
      />
      <ProblemSheet open={problemFor !== undefined} workOrderId={problemFor} onOpenChange={(o) => !o && setProblemFor(undefined)} />
    </div>
  );
}
