"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { AppData, Blocker } from "@/lib/domain/types";
import { BLOCKER_CATEGORY_LABEL } from "@/lib/domain/constants";
import { formatRelative } from "@/lib/dates";
import { employeeById, fullName, workOrderById } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UrgencyBadge } from "@/components/shared/badges";
import { EmployeeAvatar } from "@/components/shared/employee-avatar";

export function BlockerCard({
  data,
  blocker,
  onResolve,
  showWorkOrder = true,
}: {
  data: AppData;
  blocker: Blocker;
  onResolve?: (b: Blocker) => void;
  showWorkOrder?: boolean;
}) {
  const reporter = employeeById(data, blocker.reportedById);
  const wo = workOrderById(data, blocker.workOrderId);
  const resolver = employeeById(data, blocker.resolvedById);
  const photos = blocker.attachmentIds.map((id) => data.attachments.find((a) => a.id === id)).filter(Boolean);
  const open = blocker.status === "open";
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        open ? (blocker.urgency === "high" ? "border-red-200 bg-red-50/70" : "bg-white") : "bg-steel-50 opacity-90",
        blocker.category === "safety" && open && "border-red-400",
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {open ? (
          <UrgencyBadge urgency={blocker.urgency} />
        ) : (
          <span className="inline-flex h-6 items-center gap-1 rounded-md bg-emerald-100 px-1.5 text-[0.68rem] font-bold text-emerald-800 uppercase">
            <CheckCircle2 className="size-3" /> Resolved
          </span>
        )}
        <span className="text-xs font-semibold text-steel-700">{BLOCKER_CATEGORY_LABEL[blocker.category]}</span>
        {showWorkOrder && wo && (
          <Link href={`/dashboard/work-orders/${wo.id}`} className="font-mono text-xs font-semibold text-ocean hover:underline">
            {wo.number}
          </Link>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{formatRelative(blocker.reportedAt)}</span>
      </div>
      <p className="mt-1.5 text-sm text-ink">{blocker.description}</p>
      {photos.length > 0 && (
        <div className="mt-2 flex gap-2">
          {photos.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p!.id} src={p!.url} alt={p!.name} className="h-16 w-24 rounded border object-cover" />
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center gap-2">
        <EmployeeAvatar employee={reporter} size="xs" />
        <span className="text-xs text-muted-foreground">{reporter ? fullName(reporter) : "Unknown"}</span>
        {open && onResolve && (
          <Button size="sm" variant="outline" className="ml-auto bg-white" onClick={() => onResolve(blocker)}>
            <CheckCircle2 className="size-3.5" /> Resolve
          </Button>
        )}
      </div>
      {!open && blocker.resolutionNote && (
        <p className="mt-2 border-t pt-2 text-xs text-steel-600">
          <span className="font-semibold">{resolver ? fullName(resolver) : "Resolved"}:</span> {blocker.resolutionNote}
        </p>
      )}
    </div>
  );
}
