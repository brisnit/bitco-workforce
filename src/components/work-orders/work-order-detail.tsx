"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  Clock,
  ImageIcon,
  ListChecks,
  MessagesSquare,
  Pencil,
  Send,
} from "lucide-react";
import { can, checkTransition } from "@/lib/auth/permissions";
import { ALL_STATUSES, PRIORITY_META, PRIORITY_ORDER, STATUS_META, WORK_TYPE_LABEL } from "@/lib/domain/constants";
import type { Blocker, Priority, WorkOrderStatus } from "@/lib/domain/types";
import { formatDayTime, formatDue, formatShortYear } from "@/lib/dates";
import { actions, useData } from "@/lib/store/app-store";
import {
  activitiesFor,
  customerName,
  employeeById,
  fullName,
  isOverdue,
  openBlockersFor,
  workOrderById,
} from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Panel } from "@/components/shared/panel";
import { EmptyState } from "@/components/shared/empty-state";
import { EmployeeAvatar } from "@/components/shared/employee-avatar";
import { PriorityBadge, ProblemFlag, StatusBadge } from "@/components/shared/badges";
import { ProgressBar } from "@/components/shared/progress-bar";
import { StatusStepper } from "./status-stepper";
import { StatusChangeDialog } from "./status-change-dialog";
import { WorkOrderFormSheet } from "./work-order-form";
import { ActivityFeed } from "./activity-feed";
import { BlockerCard } from "./blocker-card";
import { ResolveBlockerDialog } from "./resolve-blocker-dialog";
import { ReportProblemForm } from "./report-problem-form";
import { ImageGallery } from "./image-gallery";

const NONE = "__none__";

export function WorkOrderDetail({ id }: { id: string }) {
  const data = useData();
  const router = useRouter();
  const wo = workOrderById(data, id);
  const [editOpen, setEditOpen] = useState(false);
  const [moveTo, setMoveTo] = useState<WorkOrderStatus | null>(null);
  const [resolving, setResolving] = useState<Blocker | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [note, setNote] = useState("");

  if (!wo) {
    return (
      <div className="p-6">
        <EmptyState
          icon={ClipboardList}
          title="Work order not found"
          description="It may have been removed when the demo data was reset."
          action={
            <Button asChild variant="outline">
              <Link href="/dashboard/work-orders">Back to work orders</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const role = data.session.role;
  const me = data.session.employeeId;
  const assignee = employeeById(data, wo.assigneeId);
  const supervisor = employeeById(data, wo.supervisorId);
  const blockers = data.blockers
    .filter((b) => b.workOrderId === wo.id)
    .sort((a, b) => (a.status === b.status ? b.reportedAt.localeCompare(a.reportedAt) : a.status === "open" ? -1 : 1));
  const open = openBlockersFor(data, wo.id);
  const images = wo.attachmentIds.map((aid) => data.attachments.find((a) => a.id === aid)).filter((a) => !!a);
  const overdue = isOverdue(wo);
  const canEdit = can(role, "workOrder.edit");
  const workers = data.employees.filter((e) => e.role === "worker" && e.active);
  const thread = data.threads.find((t) => t.kind === "work_order" && t.workOrderId === wo.id);
  const threadCount = thread ? data.messages.filter((m) => m.threadId === thread.id).length : 0;

  function addNote() {
    if (actions.addNote(wo!.id, note)) {
      setNote("");
      toast.success("Note added to the job history");
    }
  }

  function openConversation() {
    const tid = actions.openWorkOrderThread(wo!.id);
    if (tid) router.push(`/dashboard/messages?thread=${tid}`);
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-6">
      <Link href="/dashboard/work-orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-steel-600 hover:text-navy">
        <ArrowLeft className="size-4" /> Work orders
      </Link>

      {/* Header */}
      <div className="rounded-xl border bg-card">
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-navy px-2 py-1 font-mono text-sm font-bold text-white">{wo.number}</span>
              <PriorityBadge priority={wo.priority} />
              <StatusBadge status={wo.status} />
              <ProblemFlag count={open.length} />
              {overdue && (
                <span className="inline-flex h-6 items-center gap-1 rounded-md bg-red-50 px-1.5 text-xs font-bold text-red-700 ring-1 ring-red-200">
                  <CalendarClock className="size-3" /> Overdue
                </span>
              )}
            </div>
            <h1 className="mt-2 font-display text-2xl font-extrabold tracking-[-0.02em] text-navy sm:text-[1.7rem]">{wo.title}</h1>
            <p className="text-sm text-muted-foreground">
              {customerName(data, wo.customerId)} · {WORK_TYPE_LABEL[wo.workType]} · created {formatShortYear(wo.createdAt)} by{" "}
              {employeeById(data, wo.createdById)?.firstName ?? "office"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="h-9 bg-white" onClick={openConversation}>
              <MessagesSquare className="size-4" /> Job thread{threadCount ? ` (${threadCount})` : ""}
            </Button>
            <Button variant="outline" className="h-9 bg-white text-red-700 hover:text-red-800" onClick={() => setReportOpen(true)}>
              <AlertTriangle className="size-4" /> Report problem
            </Button>
            {canEdit && (
              <Button variant="outline" className="h-9 bg-white" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" /> Edit
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-9">
                  Change status <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Move {wo.number} to…</DropdownMenuLabel>
                {ALL_STATUSES.filter((s) => s !== wo.status).map((s, i) => {
                  const check = checkTransition(role, wo, s, me);
                  return (
                    <div key={s}>
                      {i === 4 && <DropdownMenuSeparator />}
                      <DropdownMenuItem disabled={!check.allowed} onSelect={() => setMoveTo(s)}>
                        <span className={cn("size-2 rounded-full", STATUS_META[s].dot)} />
                        {STATUS_META[s].label}
                      </DropdownMenuItem>
                    </div>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="border-t px-5 py-4">
          <StatusStepper status={wo.status} resumeStatus={wo.resumeStatus} size="lg" />
        </div>
        {(wo.status === "blocked" || wo.status === "on_hold") && (
          <div
            className={cn(
              "flex items-start gap-3 border-t px-5 py-3 text-sm",
              wo.status === "blocked" ? "bg-red-50 text-red-900" : "bg-stone-100 text-stone-800",
            )}
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div className="flex-1">
              <strong>{STATUS_META[wo.status].label}.</strong>{" "}
              {wo.status === "blocked"
                ? `Work stopped${open.length ? ` — ${open.length} open problem report${open.length > 1 ? "s" : ""}` : ""}. Resolve the problem to return it to ${STATUS_META[wo.resumeStatus ?? "ready"].label}.`
                : `Paused. It will resume at ${STATUS_META[wo.resumeStatus ?? "ready"].label}.`}
            </div>
            {wo.status === "on_hold" && can(role, "production.move") && (
              <Button size="sm" variant="outline" className="bg-white" onClick={() => setMoveTo(wo.resumeStatus ?? "ready")}>
                Resume job
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-5">
          <Panel title="Job description">
            <p className="text-[0.95rem] leading-relaxed text-ink">{wo.description || "No description."}</p>
          </Panel>

          <Panel
            title={
              <h2 className="eyebrow flex items-center gap-2 text-steel-600">
                <ListChecks className="size-3.5" /> Shop instructions
              </h2>
            }
          >
            {wo.instructions.length ? (
              <ol className="space-y-2">
                {wo.instructions.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-steel-100 font-mono text-xs font-bold text-navy">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-sm text-ink">{s}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">No instructions added.</p>
            )}
          </Panel>

          <Panel
            title={
              <h2 className="eyebrow flex items-center gap-2 text-steel-600">
                <ImageIcon className="size-3.5" /> Reference images & photos
              </h2>
            }
          >
            {images.length ? (
              <ImageGallery items={images} />
            ) : (
              <p className="text-sm text-muted-foreground">No images yet. Workers can add photos from the shop app.</p>
            )}
          </Panel>

          <Panel title="Activity & notes">
            <div className="mb-5 flex gap-2">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note for the job history…"
                rows={2}
                className="bg-white"
              />
              <Button onClick={addNote} disabled={!note.trim()} className="h-auto self-stretch" aria-label="Add note">
                <Send className="size-4" />
              </Button>
            </div>
            <ActivityFeed data={data} items={activitiesFor(data, wo.id)} />
          </Panel>
        </div>

        {/* Side column */}
        <div className="space-y-5">
          <Panel title="Details" bodyClassName="p-0">
            <dl className="divide-y text-sm">
              <Row label="Assigned worker">
                {can(role, "workOrder.assign") ? (
                  <Select
                    value={wo.assigneeId ?? NONE}
                    onValueChange={(v) => {
                      if (actions.assignWorkOrder(wo.id, v === NONE ? null : v)) {
                        toast.success(v === NONE ? `${wo.number} unassigned` : `${wo.number} assigned to ${fullName(employeeById(data, v)!)}`);
                      }
                    }}
                  >
                    <SelectTrigger size="sm" className="h-8 w-full max-w-[12rem] bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value={NONE}>Unassigned</SelectItem>
                      {workers.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {fullName(w)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Person e={assignee} />
                )}
              </Row>
              <Row label="Supervisor">
                <Person e={supervisor} />
              </Row>
              <Row label="Priority">
                {can(role, "workOrder.changePriority") ? (
                  <Select
                    value={wo.priority}
                    onValueChange={(v) => {
                      if (actions.changePriority(wo.id, v as Priority)) toast.success(`Priority set to ${PRIORITY_META[v as Priority].label}`);
                    }}
                  >
                    <SelectTrigger size="sm" className="h-8 w-32 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      {PRIORITY_ORDER.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PRIORITY_META[p].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <PriorityBadge priority={wo.priority} />
                )}
              </Row>
              <Row label="Customer">{customerName(data, wo.customerId)}</Row>
              <Row label="Work type">{WORK_TYPE_LABEL[wo.workType]}</Row>
              <Row label="Created">{formatDayTime(wo.createdAt)}</Row>
              {wo.startedAt && <Row label="Started">{formatDayTime(wo.startedAt)}</Row>}
              <Row label="Target completion">
                <span className={cn(overdue && "font-semibold text-red-600")}>
                  {formatShortYear(wo.dueDate)} · {formatDue(wo.dueDate)}
                </span>
              </Row>
              {wo.completedAt && <Row label="Completed">{formatDayTime(wo.completedAt)}</Row>}
              <Row label="Hours (actual / est.)">
                <span className="tabular inline-flex items-center gap-1 font-mono text-xs">
                  <Clock className="size-3.5 text-steel-400" />
                  {wo.actualHours ?? "—"} / {wo.estimatedHours} h
                </span>
              </Row>
              <div className="px-4 py-3">
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-muted-foreground">Worker-reported progress</span>
                  <span className="tabular font-mono font-semibold">{wo.progress}%</span>
                </div>
                <ProgressBar value={wo.progress} size="md" />
              </div>
            </dl>
          </Panel>

          <Panel
            title={
              <h2 className={cn("eyebrow flex items-center gap-2", open.length ? "text-red-700" : "text-steel-600")}>
                <AlertTriangle className="size-3.5" /> Problems {open.length ? `· ${open.length} open` : ""}
              </h2>
            }
            bodyClassName="space-y-2"
          >
            {blockers.length ? (
              blockers.map((b) => (
                <BlockerCard
                  key={b.id}
                  data={data}
                  blocker={b}
                  showWorkOrder={false}
                  onResolve={can(role, "blocker.resolve") ? setResolving : undefined}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No problems reported on this job.</p>
            )}
          </Panel>
        </div>
      </div>

      <WorkOrderFormSheet open={editOpen} onOpenChange={setEditOpen} workOrder={wo} />
      <StatusChangeDialog workOrder={moveTo ? wo : null} to={moveTo} onOpenChange={(o) => !o && setMoveTo(null)} />
      <ResolveBlockerDialog blocker={resolving} onOpenChange={(o) => !o && setResolving(null)} />
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-extrabold text-navy">Report a problem</DialogTitle>
            <DialogDescription>
              Logged on {wo.number}. High urgency (&ldquo;work is stopped&rdquo;) moves an active job to Blocked.
            </DialogDescription>
          </DialogHeader>
          <ReportProblemForm workOrderId={wo.id} onDone={() => setReportOpen(false)} onCancel={() => setReportOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 px-4 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-ink">{children}</dd>
    </div>
  );
}

function Person({ e }: { e: ReturnType<typeof employeeById> }) {
  if (!e) return <span className="text-muted-foreground italic">Unassigned</span>;
  return (
    <Link href={`/dashboard/team/${e.id}`} className="inline-flex items-center gap-2 hover:underline">
      <EmployeeAvatar employee={e} size="xs" />
      {fullName(e)}
    </Link>
  );
}
