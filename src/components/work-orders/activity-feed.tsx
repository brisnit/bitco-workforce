"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRightLeft,
  Camera,
  CheckCircle2,
  CirclePlus,
  Flag,
  MessageSquareText,
  Pencil,
  TrendingUp,
  UserRoundCheck,
} from "lucide-react";
import type { ActivityType, AppData, WorkOrderActivity } from "@/lib/domain/types";
import { formatRelative } from "@/lib/dates";
import { employeeById, fullName, workOrderById } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/badges";

const ICON: Record<ActivityType, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  created: { icon: CirclePlus, tone: "bg-steel-100 text-steel-600" },
  edited: { icon: Pencil, tone: "bg-steel-100 text-steel-600" },
  status_changed: { icon: ArrowRightLeft, tone: "bg-sky-100 text-ocean" },
  assigned: { icon: UserRoundCheck, tone: "bg-steel-100 text-navy" },
  priority_changed: { icon: Flag, tone: "bg-orange/15 text-orange-700" },
  progress: { icon: TrendingUp, tone: "bg-orange/15 text-orange-700" },
  note: { icon: MessageSquareText, tone: "bg-steel-100 text-steel-600" },
  photo: { icon: Camera, tone: "bg-steel-100 text-steel-600" },
  blocker_reported: { icon: AlertTriangle, tone: "bg-red-100 text-red-700" },
  blocker_resolved: { icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-700" },
};

export function ActivityFeed({
  data,
  items,
  showWorkOrder = false,
  workOrderHref,
  compact = false,
}: {
  data: AppData;
  items: WorkOrderActivity[];
  showWorkOrder?: boolean;
  workOrderHref?: (id: string) => string;
  compact?: boolean;
}) {
  return (
    <ol className="relative">
      {items.map((a, i) => {
        const { icon: Icon, tone } = ICON[a.type];
        const actor = employeeById(data, a.actorId);
        const wo = showWorkOrder ? workOrderById(data, a.workOrderId) : undefined;
        const photos = (a.attachmentIds ?? [])
          .map((id) => data.attachments.find((x) => x.id === id))
          .filter(Boolean);
        return (
          <li key={a.id} className={cn("relative flex gap-3", compact ? "pb-3.5" : "pb-5")}>
            {i < items.length - 1 && <span className="absolute top-8 bottom-0 left-[0.9375rem] w-px bg-border" aria-hidden />}
            <span className={cn("relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full", tone)}>
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline gap-x-1.5 text-sm">
                <span className="font-semibold text-navy">{actor ? fullName(actor) : "Someone"}</span>
                {wo &&
                  (workOrderHref ? (
                    <Link href={workOrderHref(wo.id)} className="font-mono text-xs font-semibold text-ocean hover:underline">
                      {wo.number}
                    </Link>
                  ) : (
                    <span className="font-mono text-xs font-semibold text-ocean">{wo.number}</span>
                  ))}
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">{formatRelative(a.createdAt)}</span>
              </div>
              <p className={cn("text-sm text-steel-700", compact && "line-clamp-2")}>{a.message}</p>
              {a.type === "status_changed" && a.toStatus && !compact && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  {a.fromStatus && <StatusBadge status={a.fromStatus} />}
                  {a.fromStatus && <span className="text-steel-400">→</span>}
                  <StatusBadge status={a.toStatus} />
                </div>
              )}
              {a.progress !== undefined && !compact && (
                <p className="mt-1 font-mono text-xs text-orange-700">Progress: {a.progress}%</p>
              )}
              {photos.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {photos.map((p) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={p!.id} src={p!.url} alt={p!.name} className="h-20 w-28 rounded-md border object-cover" />
                  ))}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
