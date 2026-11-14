/**
 * Domain commands — every state change in the app goes through here.
 *
 * Each command is a pure function `(data, actor, input) => { data, result }`.
 * This keeps business rules (permissions, status transitions, activity
 * logging) in one place and out of UI components. When a backend is added,
 * these become API calls / server actions with the same names and inputs.
 */
import { can, checkTransition, type Permission } from "@/lib/auth/permissions";
import { STATUS_META } from "@/lib/domain/constants";
import type {
  AppData,
  Attachment,
  Blocker,
  BlockerCategory,
  BlockerUrgency,
  Briefing,
  Employee,
  ID,
  Message,
  MessageThread,
  Priority,
  WorkOrder,
  WorkOrderActivity,
  WorkOrderStatus,
  WorkType,
} from "@/lib/domain/types";
import { employeeName } from "@/lib/selectors";

export class CommandError extends Error {}

export interface Actor {
  id: ID;
  role: AppData["session"]["role"];
}

export type CommandResult<T = void> = { data: AppData; result: T };

const nowIso = () => new Date().toISOString();

export function uid(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}

function requirePermission(actor: Actor, permission: Permission) {
  if (!can(actor.role, permission)) {
    throw new CommandError("Your demo role isn't allowed to do that.");
  }
}

function getWorkOrder(data: AppData, id: ID): WorkOrder {
  const wo = data.workOrders.find((w) => w.id === id);
  if (!wo) throw new CommandError("Work order not found.");
  return wo;
}

function activity(
  data: AppData,
  a: Omit<WorkOrderActivity, "id" | "orgId" | "createdAt"> & { createdAt?: string },
): WorkOrderActivity[] {
  return [
    ...data.activities,
    { id: uid("act"), orgId: data.organization.id, createdAt: a.createdAt ?? nowIso(), ...a },
  ];
}

function patchWorkOrder(data: AppData, id: ID, patch: Partial<WorkOrder>): WorkOrder[] {
  return data.workOrders.map((w) => (w.id === id ? { ...w, ...patch } : w));
}

// ───────────────────────────── Session ─────────────────────────────

export function setSession(data: AppData, employeeId: ID): AppData {
  const emp = data.employees.find((e) => e.id === employeeId);
  if (!emp) throw new CommandError("Employee not found.");
  return { ...data, session: { role: emp.role, employeeId } };
}

// ───────────────────────────── Attachments ─────────────────────────────

export function addAttachment(
  data: AppData,
  actor: Actor,
  input: { url: string; name: string; caption?: string },
): CommandResult<ID> {
  const att: Attachment = {
    id: uid("att"),
    orgId: data.organization.id,
    kind: "image",
    name: input.name,
    url: input.url,
    caption: input.caption,
    uploadedById: actor.id,
    createdAt: nowIso(),
  };
  return { data: { ...data, attachments: [...data.attachments, att] }, result: att.id };
}

// ───────────────────────────── Work orders ─────────────────────────────

export interface WorkOrderInput {
  customerId: ID;
  title: string;
  description: string;
  workType: WorkType;
  priority: Priority;
  assigneeId: ID | null;
  supervisorId: ID | null;
  dueDate: string;
  estimatedHours: number;
  instructions: string[];
  status: "new" | "ready";
}

export function createWorkOrder(data: AppData, actor: Actor, input: WorkOrderInput): CommandResult<ID> {
  requirePermission(actor, "workOrder.create");
  if (!input.title.trim()) throw new CommandError("A job title is required.");
  const nextNumber =
    Math.max(1000, ...data.workOrders.map((w) => Number(w.number.replace(/\D/g, "")) || 0)) + 1;
  const id = `wo-${nextNumber}`;
  const createdAt = nowIso();
  const wo: WorkOrder = {
    id,
    orgId: data.organization.id,
    locationId: data.locations[0]?.id ?? "loc-main",
    number: `WO-${nextNumber}`,
    customerId: input.customerId,
    title: input.title.trim(),
    description: input.description.trim(),
    workType: input.workType,
    priority: input.priority,
    status: input.status,
    assigneeId: input.assigneeId,
    supervisorId: input.supervisorId,
    createdAt,
    createdById: actor.id,
    dueDate: input.dueDate,
    estimatedHours: input.estimatedHours,
    progress: 0,
    instructions: input.instructions.filter((s) => s.trim()),
    attachmentIds: [],
    source: "office",
  };
  let next: AppData = { ...data, workOrders: [...data.workOrders, wo] };
  next = { ...next, activities: activity(next, { workOrderId: id, actorId: actor.id, type: "created", message: "Work order created", toStatus: "new", createdAt }) };
  if (input.assigneeId) {
    next = { ...next, activities: activity(next, { workOrderId: id, actorId: actor.id, type: "assigned", message: `Assigned to ${employeeName(next, input.assigneeId)}` }) };
  }
  if (input.status === "ready") {
    next = { ...next, activities: activity(next, { workOrderId: id, actorId: actor.id, type: "status_changed", message: "Released to the shop", fromStatus: "new", toStatus: "ready" }) };
  }
  return { data: next, result: id };
}

export function updateWorkOrder(
  data: AppData,
  actor: Actor,
  id: ID,
  input: Partial<Omit<WorkOrderInput, "status">>,
): CommandResult {
  requirePermission(actor, "workOrder.edit");
  const wo = getWorkOrder(data, id);
  let next = data;
  const { assigneeId, priority, ...rest } = input;
  const changedFields = (Object.keys(rest) as (keyof typeof rest)[]).filter(
    (k) => JSON.stringify(rest[k]) !== JSON.stringify((wo as unknown as Record<string, unknown>)[k]),
  );
  if (changedFields.length) {
    next = { ...next, workOrders: patchWorkOrder(next, id, rest) };
    next = { ...next, activities: activity(next, { workOrderId: id, actorId: actor.id, type: "edited", message: "Job details updated" }) };
  }
  if (assigneeId !== undefined && assigneeId !== wo.assigneeId) {
    next = assignWorkOrder(next, actor, id, assigneeId).data;
  }
  if (priority && priority !== wo.priority) {
    next = changePriority(next, actor, id, priority).data;
  }
  return { data: next, result: undefined };
}

export function assignWorkOrder(data: AppData, actor: Actor, id: ID, assigneeId: ID | null): CommandResult {
  requirePermission(actor, "workOrder.assign");
  const wo = getWorkOrder(data, id);
  if (wo.assigneeId === assigneeId) return { data, result: undefined };
  let next: AppData = { ...data, workOrders: patchWorkOrder(data, id, { assigneeId }) };
  next = {
    ...next,
    activities: activity(next, {
      workOrderId: id,
      actorId: actor.id,
      type: "assigned",
      message: assigneeId
        ? wo.assigneeId
          ? `Reassigned from ${employeeName(data, wo.assigneeId)} to ${employeeName(data, assigneeId)}`
          : `Assigned to ${employeeName(data, assigneeId)}`
        : "Unassigned",
    }),
  };
  return { data: next, result: undefined };
}

export function changePriority(data: AppData, actor: Actor, id: ID, priority: Priority): CommandResult {
  requirePermission(actor, "workOrder.changePriority");
  const wo = getWorkOrder(data, id);
  if (wo.priority === priority) return { data, result: undefined };
  let next: AppData = { ...data, workOrders: patchWorkOrder(data, id, { priority }) };
  next = {
    ...next,
    activities: activity(next, {
      workOrderId: id,
      actorId: actor.id,
      type: "priority_changed",
      message: `Priority changed from ${cap(wo.priority)} to ${cap(priority)}`,
    }),
  };
  return { data: next, result: undefined };
}

export function changeStatus(
  data: AppData,
  actor: Actor,
  id: ID,
  to: WorkOrderStatus,
  note?: string,
): CommandResult {
  const wo = getWorkOrder(data, id);
  const check = checkTransition(actor.role, wo, to, actor.id);
  if (!check.allowed) throw new CommandError(check.reason ?? "That status change isn't allowed.");
  const ts = nowIso();
  const patch: Partial<WorkOrder> = { status: to };
  if (to === "in_progress" && !wo.startedAt) patch.startedAt = ts;
  if (to === "quality_check") patch.progress = 100;
  if (to === "completed") {
    patch.completedAt = ts;
    patch.progress = 100;
    if (wo.actualHours === undefined) patch.actualHours = wo.estimatedHours;
  }
  if (from(wo) === "completed" && to !== "completed") patch.completedAt = undefined;
  if (to === "on_hold" || to === "blocked") patch.resumeStatus = wo.status === "blocked" || wo.status === "on_hold" ? wo.resumeStatus : wo.status;
  else patch.resumeStatus = undefined;

  let next: AppData = { ...data, workOrders: patchWorkOrder(data, id, patch) };
  const verb: Partial<Record<WorkOrderStatus, string>> = {
    ready: "Released to the shop",
    in_progress: wo.status === "ready" ? "Started work" : "Moved to In Progress",
    quality_check: "Marked ready for Quality Check",
    completed: wo.status === "quality_check" ? "Passed Quality Check — completed" : "Marked completed",
    on_hold: "Put on hold",
    blocked: "Marked blocked",
    cancelled: "Cancelled",
    new: "Moved back to New",
  };
  next = {
    ...next,
    activities: activity(next, {
      workOrderId: id,
      actorId: actor.id,
      type: "status_changed",
      message: `${verb[to] ?? `Moved to ${STATUS_META[to].label}`}${note?.trim() ? ` — ${note.trim()}` : ""}`,
      fromStatus: wo.status,
      toStatus: to,
      createdAt: ts,
    }),
  };
  // Keep the assignee's self-reported availability roughly in sync.
  if (wo.assigneeId && (to === "in_progress" || to === "completed" || to === "quality_check")) {
    next = {
      ...next,
      employees: next.employees.map((e) =>
        e.id === wo.assigneeId && e.workStatus !== "off_today"
          ? { ...e, workStatus: to === "in_progress" ? "on_job" : hasOtherActiveJob(next, e.id, id) ? "on_job" : "available" }
          : e,
      ),
    };
  }
  return { data: next, result: undefined };
}

function from(wo: WorkOrder) {
  return wo.status;
}

function hasOtherActiveJob(data: AppData, employeeId: ID, exceptId: ID) {
  return data.workOrders.some((w) => w.id !== exceptId && w.assigneeId === employeeId && w.status === "in_progress");
}

export interface ProgressInput {
  message: string;
  progress?: number;
  attachmentIds?: ID[];
  status?: WorkOrderStatus;
}

export function submitProgress(data: AppData, actor: Actor, id: ID, input: ProgressInput): CommandResult {
  const wo = getWorkOrder(data, id);
  if (actor.role === "worker" && wo.assigneeId !== actor.id) {
    throw new CommandError("Only the assigned worker can post progress on this job.");
  }
  if (!input.message.trim() && !input.attachmentIds?.length && input.progress === undefined && !input.status) {
    throw new CommandError("Add a short update, a photo, or a new status.");
  }
  let next = data;
  if (input.progress !== undefined && input.progress !== wo.progress) {
    next = { ...next, workOrders: patchWorkOrder(next, id, { progress: Math.max(0, Math.min(100, input.progress)) }) };
  }
  if (input.message.trim() || input.attachmentIds?.length || input.progress !== undefined) {
    next = {
      ...next,
      workOrders: input.attachmentIds?.length
        ? patchWorkOrder(next, id, { attachmentIds: [...getWorkOrder(next, id).attachmentIds, ...input.attachmentIds] })
        : next.workOrders,
      activities: activity(next, {
        workOrderId: id,
        actorId: actor.id,
        type: input.attachmentIds?.length && !input.message.trim() ? "photo" : "progress",
        message: input.message.trim() || (input.attachmentIds?.length ? "Added a photo" : `Progress updated to ${input.progress}%`),
        progress: input.progress,
        attachmentIds: input.attachmentIds,
      }),
    };
  }
  if (input.status && input.status !== wo.status) {
    next = changeStatus(next, actor, id, input.status).data;
  }
  return { data: next, result: undefined };
}

export function addNote(data: AppData, actor: Actor, id: ID, text: string): CommandResult {
  if (!text.trim()) throw new CommandError("Note can't be empty.");
  getWorkOrder(data, id);
  return {
    data: { ...data, activities: activity(data, { workOrderId: id, actorId: actor.id, type: "note", message: text.trim() }) },
    result: undefined,
  };
}

// ───────────────────────────── Blockers ─────────────────────────────

export interface BlockerInput {
  workOrderId: ID | null;
  category: BlockerCategory;
  urgency: BlockerUrgency;
  description: string;
  attachmentIds: ID[];
}

export function reportBlocker(data: AppData, actor: Actor, input: BlockerInput): CommandResult<ID> {
  requirePermission(actor, "blocker.report");
  if (!input.description.trim()) throw new CommandError("Describe the problem in a few words.");
  const blocker: Blocker = {
    id: uid("blk"),
    orgId: data.organization.id,
    workOrderId: input.workOrderId,
    category: input.category,
    urgency: input.urgency,
    description: input.description.trim(),
    reportedById: actor.id,
    reportedAt: nowIso(),
    status: "open",
    attachmentIds: input.attachmentIds,
  };
  let next: AppData = { ...data, blockers: [...data.blockers, blocker] };
  if (input.workOrderId) {
    const wo = getWorkOrder(next, input.workOrderId);
    next = {
      ...next,
      activities: activity(next, {
        workOrderId: wo.id,
        actorId: actor.id,
        type: "blocker_reported",
        message: `Reported problem: ${blocker.description}`,
        attachmentIds: input.attachmentIds,
      }),
    };
    // "Work is stopped" moves an active job to Blocked automatically.
    if (input.urgency === "high" && ["ready", "in_progress", "quality_check"].includes(wo.status)) {
      next = {
        ...next,
        workOrders: patchWorkOrder(next, wo.id, { status: "blocked", resumeStatus: wo.status }),
        activities: activity(next, {
          workOrderId: wo.id,
          actorId: actor.id,
          type: "status_changed",
          message: "Marked blocked — work stopped by reported problem",
          fromStatus: wo.status,
          toStatus: "blocked",
        }),
      };
    }
  }
  return { data: next, result: blocker.id };
}

export function resolveBlocker(data: AppData, actor: Actor, id: ID, note: string, resume: boolean): CommandResult {
  requirePermission(actor, "blocker.resolve");
  const blocker = data.blockers.find((b) => b.id === id);
  if (!blocker) throw new CommandError("Problem report not found.");
  if (blocker.status === "resolved") return { data, result: undefined };
  const ts = nowIso();
  let next: AppData = {
    ...data,
    blockers: data.blockers.map((b) =>
      b.id === id ? { ...b, status: "resolved", resolvedById: actor.id, resolvedAt: ts, resolutionNote: note.trim() || "Resolved" } : b,
    ),
  };
  if (blocker.workOrderId) {
    next = {
      ...next,
      activities: activity(next, {
        workOrderId: blocker.workOrderId,
        actorId: actor.id,
        type: "blocker_resolved",
        message: `Problem resolved${note.trim() ? `: ${note.trim()}` : ""}`,
      }),
    };
    const wo = getWorkOrder(next, blocker.workOrderId);
    const otherOpen = next.blockers.some((b) => b.workOrderId === wo.id && b.status === "open" && b.urgency === "high");
    if (resume && wo.status === "blocked" && !otherOpen) {
      const to = wo.resumeStatus ?? "ready";
      next = {
        ...next,
        workOrders: patchWorkOrder(next, wo.id, { status: to, resumeStatus: undefined }),
        activities: activity(next, {
          workOrderId: wo.id,
          actorId: actor.id,
          type: "status_changed",
          message: `Unblocked — back to ${STATUS_META[to].label}`,
          fromStatus: "blocked",
          toStatus: to,
        }),
      };
    }
  }
  return { data: next, result: undefined };
}

// ───────────────────────────── Briefings ─────────────────────────────

export type BriefingInput = Omit<Briefing, "id" | "orgId" | "status" | "authorId" | "createdAt" | "updatedAt" | "publishedAt">;

export function saveBriefing(
  data: AppData,
  actor: Actor,
  input: BriefingInput,
  opts: { id?: ID; publish: boolean },
): CommandResult<ID> {
  requirePermission(actor, "briefing.manage");
  if (!input.title.trim()) throw new CommandError("Give the briefing a title.");
  if (opts.publish && !input.message.trim()) throw new CommandError("Add a general message before publishing.");
  if (input.audience.type === "team" && input.audience.teamIds.length === 0)
    throw new CommandError("Pick at least one team.");
  if (input.audience.type === "employees" && input.audience.employeeIds.length === 0)
    throw new CommandError("Pick at least one employee.");
  const ts = nowIso();
  const clean = (xs: string[]) => xs.map((s) => s.trim()).filter(Boolean);
  const body = {
    ...input,
    title: input.title.trim(),
    message: input.message.trim(),
    priorities: clean(input.priorities),
    safetyReminders: clean(input.safetyReminders),
    equipmentUpdates: clean(input.equipmentUpdates),
    announcements: clean(input.announcements),
  };
  if (opts.id) {
    const existing = data.briefings.find((b) => b.id === opts.id);
    if (!existing) throw new CommandError("Briefing not found.");
    const updated: Briefing = {
      ...existing,
      ...body,
      updatedAt: ts,
      status: opts.publish ? "published" : existing.status,
      publishedAt: opts.publish ? existing.publishedAt ?? ts : existing.publishedAt,
    };
    return { data: { ...data, briefings: data.briefings.map((b) => (b.id === opts.id ? updated : b)) }, result: opts.id };
  }
  const briefing: Briefing = {
    id: uid("brf"),
    orgId: data.organization.id,
    ...body,
    status: opts.publish ? "published" : "draft",
    authorId: actor.id,
    createdAt: ts,
    updatedAt: ts,
    publishedAt: opts.publish ? ts : undefined,
  };
  return { data: { ...data, briefings: [...data.briefings, briefing] }, result: briefing.id };
}

export function deleteBriefing(data: AppData, actor: Actor, id: ID): CommandResult {
  requirePermission(actor, "briefing.manage");
  return {
    data: {
      ...data,
      briefings: data.briefings.filter((b) => b.id !== id),
      acknowledgements: data.acknowledgements.filter((a) => a.briefingId !== id),
    },
    result: undefined,
  };
}

export function acknowledgeBriefing(data: AppData, actor: Actor, briefingId: ID): CommandResult {
  const b = data.briefings.find((x) => x.id === briefingId);
  if (!b || b.status !== "published") throw new CommandError("Briefing not available.");
  if (data.acknowledgements.some((a) => a.briefingId === briefingId && a.employeeId === actor.id)) {
    return { data, result: undefined };
  }
  return {
    data: {
      ...data,
      acknowledgements: [
        ...data.acknowledgements,
        { id: uid("ack"), briefingId, employeeId: actor.id, acknowledgedAt: nowIso() },
      ],
    },
    result: undefined,
  };
}

// ───────────────────────────── Messages ─────────────────────────────

export function sendMessage(
  data: AppData,
  actor: Actor,
  threadId: ID,
  input: { body: string; workOrderId?: ID; attachmentIds?: ID[] },
): CommandResult<ID> {
  requirePermission(actor, "message.send");
  const thread = data.threads.find((t) => t.id === threadId);
  if (!thread) throw new CommandError("Conversation not found.");
  if (thread.kind === "announcement" && !can(actor.role, "announcement.send")) {
    throw new CommandError("Only supervisors and the office can post announcements.");
  }
  if (!input.body.trim() && !input.attachmentIds?.length) throw new CommandError("Message is empty.");
  const msg: Message = {
    id: uid("msg"),
    threadId,
    senderId: actor.id,
    body: input.body.trim(),
    createdAt: nowIso(),
    workOrderId: input.workOrderId ?? thread.workOrderId,
    attachmentIds: input.attachmentIds,
  };
  const next = markThreadRead({ ...data, messages: [...data.messages, msg] }, actor.id, threadId, msg.createdAt);
  return { data: next, result: msg.id };
}

export function openDirectThread(data: AppData, actor: Actor, otherId: ID): CommandResult<ID> {
  const existing = data.threads.find(
    (t) => t.kind === "direct" && t.participantIds.length === 2 && t.participantIds.includes(actor.id) && t.participantIds.includes(otherId),
  );
  if (existing) return { data, result: existing.id };
  const thread: MessageThread = {
    id: uid("th"),
    orgId: data.organization.id,
    kind: "direct",
    participantIds: [actor.id, otherId],
    createdAt: nowIso(),
  };
  return { data: { ...data, threads: [...data.threads, thread] }, result: thread.id };
}

export function openWorkOrderThread(data: AppData, actor: Actor, workOrderId: ID): CommandResult<ID> {
  const existing = data.threads.find((t) => t.kind === "work_order" && t.workOrderId === workOrderId);
  const wo = getWorkOrder(data, workOrderId);
  const people = [actor.id, wo.assigneeId, wo.supervisorId].filter(Boolean) as ID[];
  if (existing) {
    if (existing.participantIds.includes(actor.id)) return { data, result: existing.id };
    return {
      data: { ...data, threads: data.threads.map((t) => (t.id === existing.id ? { ...t, participantIds: [...t.participantIds, actor.id] } : t)) },
      result: existing.id,
    };
  }
  const thread: MessageThread = {
    id: uid("th"),
    orgId: data.organization.id,
    kind: "work_order",
    workOrderId,
    title: `${wo.number} · ${wo.title}`,
    participantIds: Array.from(new Set(people)),
    createdAt: nowIso(),
  };
  return { data: { ...data, threads: [...data.threads, thread] }, result: thread.id };
}

export function markThreadRead(data: AppData, employeeId: ID, threadId: ID, at: string = nowIso()): AppData {
  const current = data.threadReads[employeeId]?.[threadId];
  if (current && current >= at) return data;
  return {
    ...data,
    threadReads: { ...data.threadReads, [employeeId]: { ...data.threadReads[employeeId], [threadId]: at } },
  };
}

// ───────────────────────────── Team ─────────────────────────────

export type EmployeeInput = Pick<Employee, "firstName" | "lastName" | "position" | "teamId" | "supervisorId" | "role" | "phone"> & {
  skills: string[];
};

export function addEmployee(data: AppData, actor: Actor, input: EmployeeInput): CommandResult<ID> {
  requirePermission(actor, "team.manage");
  if (!input.firstName.trim()) throw new CommandError("First name is required.");
  const e: Employee = {
    id: uid("emp"),
    orgId: data.organization.id,
    ...input,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    workStatus: "available",
    active: true,
    startedOn: new Date().toISOString().slice(0, 10),
  };
  return { data: { ...data, employees: [...data.employees, e] }, result: e.id };
}

export function updateEmployee(data: AppData, actor: Actor, id: ID, patch: Partial<Employee>): CommandResult {
  if (!(can(actor.role, "team.manage") || (actor.id === id && Object.keys(patch).every((k) => k === "workStatus")))) {
    throw new CommandError("Your demo role isn't allowed to do that.");
  }
  return { data: { ...data, employees: data.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)) }, result: undefined };
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
