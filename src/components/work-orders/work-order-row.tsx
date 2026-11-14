"use client";

import Link from "next/link";
import { CalendarClock } from "lucide-react";
import type { AppData, WorkOrder } from "@/lib/domain/types";
import { formatDue } from "@/lib/dates";
import { customerName, employeeById, isOverdue, openBlockersFor } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { PriorityBadge, ProblemFlag, StatusBadge } from "@/components/shared/badges";
import { EmployeeAvatar } from "@/components/shared/employee-avatar";
import { ProgressBar } from "@/components/shared/progress-bar";

/** Compact list row used on the Overview and Team pages. */
export function WorkOrderRow({ data, wo, href }: { data: AppData; wo: WorkOrder; href: string }) {
  const assignee = employeeById(data, wo.assigneeId);
  const overdue = isOverdue(wo);
  const problems = openBlockersFor(data, wo.id).length;
  return (
    <Link
      href={href}
      className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 rounded-lg px-2 py-2.5 transition hover:bg-steel-50 sm:grid-cols-[auto_1fr_8rem_7rem_auto]"
    >
      <EmployeeAvatar employee={assignee} size="sm" />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-ocean">{wo.number}</span>
          <PriorityBadge priority={wo.priority} />
          <ProblemFlag count={problems} />
        </div>
        <p className="truncate text-sm font-semibold text-navy group-hover:underline">{wo.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {customerName(data, wo.customerId)} · {assignee ? assignee.firstName : "Unassigned"}
        </p>
      </div>
      <div className="hidden sm:block">
        <ProgressBar value={wo.progress} />
        <span className="tabular mt-1 block text-[0.7rem] text-muted-foreground">{wo.progress}%</span>
      </div>
      <div className={cn("hidden items-center gap-1 text-xs sm:flex", overdue ? "font-semibold text-red-600" : "text-steel-600")}>
        <CalendarClock className="size-3.5" />
        {overdue ? `Overdue · ${formatDue(wo.dueDate)}` : formatDue(wo.dueDate)}
      </div>
      <StatusBadge status={wo.status} />
    </Link>
  );
}
