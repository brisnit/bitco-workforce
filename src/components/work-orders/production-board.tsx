"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CalendarClock, GripVertical, Info, Search } from "lucide-react";
import { can } from "@/lib/auth/permissions";
import { PRIORITY_META, PRIORITY_ORDER, PRODUCTION_FLOW, SECONDARY_STATUSES, STATUS_META } from "@/lib/domain/constants";
import type { AppData, WorkOrder, WorkOrderStatus } from "@/lib/domain/types";
import { diffDays, formatDue } from "@/lib/dates";
import { useData } from "@/lib/store/app-store";
import { customerName, employeeById, fullName, isOverdue, openBlockersFor, sortByUrgency } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { EmployeeAvatar } from "@/components/shared/employee-avatar";
import { PriorityBadge, ProblemFlag } from "@/components/shared/badges";
import { ProgressBar } from "@/components/shared/progress-bar";
import { StatusChangeDialog } from "./status-change-dialog";

const ANY = "any";

export function ProductionBoard() {
  const data = useData();
  const router = useRouter();
  const canMove = can(data.session.role, "production.move");
  const [q, setQ] = useState("");
  const [assignee, setAssignee] = useState(ANY);
  const [priority, setPriority] = useState(ANY);
  const [queue, setQueue] = useState<WorkOrderStatus | null>(null);
  const [dragging, setDragging] = useState<WorkOrder | null>(null);
  const [pending, setPending] = useState<{ wo: WorkOrder; to: WorkOrderStatus } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.workOrders.filter((w) => {
      if (assignee !== ANY && (assignee === "none" ? w.assigneeId : w.assigneeId !== assignee)) return false;
      if (priority !== ANY && w.priority !== priority) return false;
      if (needle && !`${w.number} ${w.title} ${customerName(data, w.customerId)}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [data, q, assignee, priority]);

  const byStatus = (s: WorkOrderStatus) => {
    const list = filtered.filter((w) => w.status === s);
    if (s === "completed") {
      return list
        .filter((w) => w.completedAt && diffDays(w.completedAt, new Date()) <= 14)
        .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
    }
    return list.sort(sortByUrgency);
  };

  function onDragStart(e: DragStartEvent) {
    setDragging(data.workOrders.find((w) => w.id === e.active.id) ?? null);
  }
  function onDragEnd(e: DragEndEvent) {
    setDragging(null);
    const wo = data.workOrders.find((w) => w.id === e.active.id);
    const to = e.over?.id as WorkOrderStatus | undefined;
    if (!wo || !to || wo.status === to) return;
    setPending({ wo, to });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-4 p-4 pb-3 sm:p-6 sm:pb-3">
        <PageHeader
          eyebrow="Shop floor"
          title="Production board"
          description={
            canMove
              ? "Drag a job to move it through production. Every move is confirmed and logged."
              : "Live view of every job on the floor."
          }
        />
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-steel-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter jobs" className="h-9 bg-white pl-8" aria-label="Filter jobs" />
          </div>
          <Select value={assignee} onValueChange={setAssignee}>
            <SelectTrigger size="sm" className="h-9 bg-white" aria-label="Assignee">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Everyone</SelectItem>
              <SelectItem value="none">Unassigned</SelectItem>
              {data.employees
                .filter((e) => e.role === "worker")
                .map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {fullName(e)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger size="sm" className="h-9 bg-white" aria-label="Priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any priority</SelectItem>
              {PRIORITY_ORDER.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_META[p].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="ml-auto hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
            <Info className="size-3.5" /> Completed column shows the last 14 days
          </span>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
        {/* Secondary queues */}
        <div className="flex flex-wrap gap-2 px-4 pb-3 sm:px-6">
          <span className="eyebrow self-center text-steel-500">Off the line:</span>
          {SECONDARY_STATUSES.map((s) => (
            <QueueChip
              key={s}
              status={s}
              count={filtered.filter((w) => w.status === s).length}
              active={queue === s}
              onClick={() => setQueue(queue === s ? null : s)}
              droppable={canMove}
            />
          ))}
        </div>
        {queue && (
          <div className="mx-4 mb-3 rounded-xl border bg-white p-3 sm:mx-6">
            <p className="mb-2 text-xs text-muted-foreground">{STATUS_META[queue].description}</p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {byStatus(queue).length ? (
                byStatus(queue).map((w) => (
                  <div key={w.id} className="w-72 shrink-0">
                    <BoardCard data={data} wo={w} canMove={canMove} onOpen={() => router.push(`/dashboard/work-orders/${w.id}`)} />
                  </div>
                ))
              ) : (
                <p className="py-4 text-sm text-muted-foreground">Nothing here.</p>
              )}
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-x-auto px-4 pb-6 sm:px-6">
          <div className="grid h-full min-w-[1100px] grid-cols-5 gap-3">
            {PRODUCTION_FLOW.map((s) => (
              <Column key={s} status={s} items={byStatus(s)} canMove={canMove}>
                {byStatus(s).map((w) => (
                  <BoardCard key={w.id} data={data} wo={w} canMove={canMove} onOpen={() => router.push(`/dashboard/work-orders/${w.id}`)} />
                ))}
              </Column>
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {dragging ? <CardBody data={data} wo={dragging} overlay /> : null}
        </DragOverlay>
      </DndContext>

      <StatusChangeDialog workOrder={pending?.wo ?? null} to={pending?.to ?? null} onOpenChange={(o) => !o && setPending(null)} />
    </div>
  );
}

function Column({
  status,
  items,
  canMove,
  children,
}: {
  status: WorkOrderStatus;
  items: WorkOrder[];
  canMove: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status, disabled: !canMove });
  const meta = STATUS_META[status];
  const hours = items.reduce((s, w) => s + w.estimatedHours, 0);
  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[24rem] flex-col rounded-xl border bg-steel-50/80 transition",
        isOver && "border-orange bg-orange/5 ring-2 ring-orange/30",
      )}
      aria-label={meta.label}
    >
      <header className="flex items-center gap-2 border-b px-3 py-2.5">
        <span className={cn("size-2.5 rounded-full", meta.dot)} />
        <h2 className="font-display text-sm font-bold text-navy">{meta.label}</h2>
        <span className="tabular rounded-full bg-white px-1.5 text-xs font-semibold text-steel-600 ring-1 ring-border">{items.length}</span>
        <span className="tabular ml-auto font-mono text-[0.65rem] text-muted-foreground">{status === "completed" ? "" : `${hours}h est.`}</span>
      </header>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {children}
        {items.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
            {canMove ? "Drop a job here" : "No jobs"}
          </div>
        )}
      </div>
    </section>
  );
}

function QueueChip({
  status,
  count,
  active,
  onClick,
  droppable,
}: {
  status: WorkOrderStatus;
  count: number;
  active: boolean;
  onClick: () => void;
  droppable: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status, disabled: !droppable });
  const meta = STATUS_META[status];
  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-full border bg-white px-3 text-sm font-medium transition",
        active && "border-navy ring-1 ring-navy",
        isOver && "scale-105 border-orange bg-orange/10 ring-2 ring-orange/40",
        status === "blocked" && count > 0 && "border-red-300 text-red-700",
      )}
      aria-pressed={active}
    >
      <span className={cn("size-2 rounded-full", meta.dot)} />
      {meta.label}
      <span className="tabular rounded-full bg-steel-100 px-1.5 text-xs">{count}</span>
    </button>
  );
}

function BoardCard({ data, wo, canMove, onOpen }: { data: AppData; wo: WorkOrder; canMove: boolean; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: wo.id, disabled: !canMove });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      role="button"
      aria-roledescription={canMove ? "Draggable job card" : undefined}
      aria-label={`${wo.number} ${wo.title}`}
    >
      <CardBody data={data} wo={wo} canMove={canMove} />
    </div>
  );
}

function CardBody({ data, wo, overlay, canMove }: { data: AppData; wo: WorkOrder; overlay?: boolean; canMove?: boolean }) {
  const a = employeeById(data, wo.assigneeId);
  const overdue = isOverdue(wo);
  const problems = openBlockersFor(data, wo.id).length;
  return (
    <article
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-lg border bg-white p-3 pl-3.5 shadow-[0_1px_2px_rgb(3_38_65/0.06)] transition hover:border-steel-300 hover:shadow-md",
        overlay && "rotate-[1.5deg] cursor-grabbing shadow-xl ring-2 ring-orange",
        problems > 0 && "border-red-200",
      )}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", PRIORITY_META[wo.priority].bar)} aria-hidden />
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-xs font-bold text-ocean">{wo.number}</span>
        <PriorityBadge priority={wo.priority} />
        <ProblemFlag count={problems} />
        {canMove && <GripVertical className="ml-auto size-4 text-steel-300 group-hover:text-steel-500" aria-hidden />}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-[0.7rem] font-semibold tracking-wide text-steel-500 uppercase">
          {customerName(data, wo.customerId)}
        </p>
        <span className="inline-flex shrink-0 items-center gap-1 text-[0.68rem] font-semibold text-steel-600">
          <span className={cn("size-1.5 rounded-full", STATUS_META[wo.status].dot)} />
          {STATUS_META[wo.status].short}
        </span>
      </div>
      <Link
        href={`/dashboard/work-orders/${wo.id}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="line-clamp-2 text-sm leading-snug font-semibold text-navy hover:underline"
      >
        {wo.title}
      </Link>
      {wo.status === "in_progress" && <ProgressBar value={wo.progress} className="mt-2" />}
      <div className="mt-2.5 flex items-center gap-2 border-t pt-2">
        <EmployeeAvatar employee={a} size="xs" />
        <span className={cn("min-w-0 flex-1 truncate text-xs", a ? "text-steel-700" : "text-muted-foreground italic")}>
          {a ? fullName(a) : "Unassigned"}
        </span>
        <span className={cn("inline-flex items-center gap-1 text-xs", overdue ? "font-bold text-red-600" : "text-steel-500")}>
          <CalendarClock className="size-3" />
          {wo.status === "completed" && wo.completedAt ? `Done ${formatDue(wo.completedAt)}` : formatDue(wo.dueDate)}
        </span>
      </div>
    </article>
  );
}
