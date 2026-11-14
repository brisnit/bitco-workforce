"use client";

import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, CalendarClock, ChevronRight, Play, TrendingUp } from "lucide-react";
import type { AppData, WorkOrder } from "@/lib/domain/types";
import { STATUS_META } from "@/lib/domain/constants";
import { formatDue } from "@/lib/dates";
import { actions } from "@/lib/store/app-store";
import { customerName, isOverdue, openBlockersFor } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { ProgressBar } from "@/components/shared/progress-bar";

/** Large, glove-friendly assignment card. */
export function WorkerJobCard({ data, wo, onUpdate }: { data: AppData; wo: WorkOrder; onUpdate?: (wo: WorkOrder) => void }) {
  const overdue = isOverdue(wo);
  const problems = openBlockersFor(data, wo.id).length;
  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border-2 bg-white shadow-sm",
        wo.status === "blocked" ? "border-red-300" : wo.priority === "rush" || wo.priority === "high" ? "border-orange/60" : "border-steel-200",
      )}
    >
      <Link href={`/worker/jobs/${wo.id}`} className="block p-4 active:bg-steel-50">
        <div className="flex items-center gap-2">
          <span className="font-mono text-lg font-bold text-navy">{wo.number}</span>
          <PriorityBadge priority={wo.priority} size="lg" />
          <ChevronRight className="ml-auto size-6 text-steel-400" />
        </div>
        <h3 className="mt-1.5 font-display text-xl leading-tight font-extrabold text-ink">{wo.title}</h3>
        <p className="mt-0.5 text-sm text-steel-600">{customerName(data, wo.customerId)}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={wo.status} size="lg" />
          <span className={cn("inline-flex items-center gap-1.5 text-[0.95rem] font-semibold", overdue ? "text-red-600" : "text-steel-700")}>
            <CalendarClock className="size-4" /> Due {formatDue(wo.dueDate)}
            {overdue && " · overdue"}
          </span>
        </div>
        {wo.status === "in_progress" && (
          <div className="mt-3 flex items-center gap-3">
            <ProgressBar value={wo.progress} size="md" />
            <span className="tabular font-mono text-sm font-bold">{wo.progress}%</span>
          </div>
        )}
        {problems > 0 && (
          <p className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            <AlertTriangle className="size-4" /> Problem reported — waiting on supervisor
          </p>
        )}
      </Link>
      {(wo.status === "ready" || wo.status === "in_progress") && (
        <div className="border-t p-3">
          {wo.status === "ready" ? (
            <Button
              variant="brand"
              size="xl"
              className="w-full"
              onClick={() => {
                if (actions.changeStatus(wo.id, "in_progress")) toast.success(`${wo.number} started`, { description: "Status: In Progress" });
              }}
            >
              <Play className="fill-current" /> Start job
            </Button>
          ) : (
            <Button size="xl" className="w-full" onClick={() => onUpdate?.(wo)}>
              <TrendingUp /> Update progress
            </Button>
          )}
        </div>
      )}
      {wo.status === "quality_check" && (
        <p className="border-t bg-violet-50 px-4 py-3 text-sm font-medium text-violet-900">{STATUS_META.quality_check.description}</p>
      )}
    </article>
  );
}
