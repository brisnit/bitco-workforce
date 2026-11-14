import { AlertTriangle, ArrowUp, Flame, Minus } from "lucide-react";
import { BLOCKER_URGENCY_META, PRIORITY_META, STATUS_META } from "@/lib/domain/constants";
import type { BlockerUrgency, Priority, WorkOrderStatus } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  size = "sm",
  className,
}: {
  status: WorkOrderStatus;
  size?: "sm" | "lg";
  className?: string;
}) {
  const m = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md font-semibold whitespace-nowrap ring-1 ring-inset",
        size === "sm" ? "h-6 px-2 text-xs" : "h-8 px-3 text-sm",
        m.tone,
        status === "cancelled" && "line-through decoration-1",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", m.dot, size === "lg" && "size-2")} />
      {m.label}
    </span>
  );
}

const PRIORITY_ICON: Record<Priority, React.ComponentType<{ className?: string }>> = {
  rush: Flame,
  high: ArrowUp,
  medium: Minus,
  normal: Minus,
};

export function PriorityBadge({
  priority,
  size = "sm",
  className,
}: {
  priority: Priority;
  size?: "sm" | "lg";
  className?: string;
}) {
  const m = PRIORITY_META[priority];
  const Icon = PRIORITY_ICON[priority];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md font-display font-bold tracking-wide uppercase ring-1 ring-inset",
        size === "sm" ? "h-6 px-1.5 text-[0.68rem]" : "h-8 px-2.5 text-xs",
        m.tone,
        className,
      )}
    >
      <Icon className={size === "sm" ? "size-3" : "size-3.5"} />
      {m.label}
    </span>
  );
}

export function UrgencyBadge({ urgency, className }: { urgency: BlockerUrgency; className?: string }) {
  const m = BLOCKER_URGENCY_META[urgency];
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-1.5 font-display text-[0.68rem] font-bold tracking-wide uppercase ring-1 ring-inset",
        m.tone,
        className,
      )}
    >
      {urgency === "high" && <AlertTriangle className="size-3" />}
      {m.label}
    </span>
  );
}

export function ProblemFlag({ count, className }: { count: number; className?: string }) {
  if (!count) return null;
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-md bg-red-600 px-1.5 text-[0.68rem] font-bold text-white uppercase",
        className,
      )}
      title={`${count} open problem${count > 1 ? "s" : ""} reported`}
    >
      <AlertTriangle className="size-3" />
      {count > 1 ? `${count} problems` : "Problem"}
    </span>
  );
}

export function DemoTag({ className, children = "Demo data" }: { className?: string; children?: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-sm border border-dashed border-orange-700/50 bg-orange/5 px-1.5 font-mono text-[0.625rem] font-medium tracking-wide text-orange-700 uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
}
