/**
 * Derived data. Every metric shown in the UI is computed here from the
 * underlying records — nothing is hard-coded.
 */
import { ACTIVE_STATUSES, PRIORITY_META, PRODUCTION_FLOW, SECONDARY_STATUSES } from "@/lib/domain/constants";
import type {
  AppData,
  Blocker,
  BlockerCategory,
  Briefing,
  Employee,
  ID,
  MessageThread,
  WorkOrder,
  WorkOrderStatus,
} from "@/lib/domain/types";
import { addDays, diffDays, startOfWeek, toDateKey, todayKey } from "@/lib/dates";

// ───────────── Lookups ─────────────

export const fullName = (e: Pick<Employee, "firstName" | "lastName">) => `${e.firstName} ${e.lastName}`.trim();

export function employeeById(data: AppData, id: ID | null | undefined): Employee | undefined {
  return id ? data.employees.find((e) => e.id === id) : undefined;
}

export function employeeName(data: AppData, id: ID | null | undefined, fallback = "Unassigned"): string {
  const e = employeeById(data, id);
  return e ? fullName(e) : fallback;
}

export function customerName(data: AppData, id: ID): string {
  return data.customers.find((c) => c.id === id)?.name ?? "Unknown customer";
}

export function teamName(data: AppData, id: ID | null): string {
  return data.teams.find((t) => t.id === id)?.name ?? "—";
}

export function workOrderById(data: AppData, id: ID | null | undefined): WorkOrder | undefined {
  return id ? data.workOrders.find((w) => w.id === id) : undefined;
}

export function currentEmployee(data: AppData): Employee {
  return employeeById(data, data.session.employeeId) ?? data.employees[0];
}

// ───────────── Work orders ─────────────

export const isActive = (wo: WorkOrder) => ACTIVE_STATUSES.includes(wo.status);
export const isClosed = (wo: WorkOrder) => wo.status === "completed" || wo.status === "cancelled";
export const isOverdue = (wo: WorkOrder) => !isClosed(wo) && diffDays(todayKey(), wo.dueDate) < 0;
export const isDueToday = (wo: WorkOrder) => !isClosed(wo) && wo.dueDate === todayKey();

export function sortByUrgency(a: WorkOrder, b: WorkOrder): number {
  const od = Number(isOverdue(b)) - Number(isOverdue(a));
  if (od) return od;
  const pr = PRIORITY_META[a.priority].rank - PRIORITY_META[b.priority].rank;
  if (pr) return pr;
  return a.dueDate.localeCompare(b.dueDate);
}

export function openBlockers(data: AppData): Blocker[] {
  return data.blockers
    .filter((b) => b.status === "open")
    .sort((a, b) => urgencyRank(a) - urgencyRank(b) || b.reportedAt.localeCompare(a.reportedAt));
}

const urgencyRank = (b: Blocker) => ({ high: 0, medium: 1, low: 2 })[b.urgency];

export function openBlockersFor(data: AppData, workOrderId: ID): Blocker[] {
  return data.blockers.filter((b) => b.workOrderId === workOrderId && b.status === "open");
}

export function workOrdersForEmployee(data: AppData, employeeId: ID): WorkOrder[] {
  return data.workOrders.filter((w) => w.assigneeId === employeeId).sort(sortByUrgency);
}

export function activitiesFor(data: AppData, workOrderId: ID) {
  return data.activities
    .filter((a) => a.workOrderId === workOrderId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function shopActivity(data: AppData, limit = 12) {
  return [...data.activities].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

// ───────────── Briefings ─────────────

export function isBriefingRecipient(briefing: Briefing, e: Employee): boolean {
  if (!e.active || e.role === "admin") return false;
  const a = briefing.audience;
  if (a.type === "all") return true;
  if (a.type === "team") return !!e.teamId && a.teamIds.includes(e.teamId);
  return a.employeeIds.includes(e.id);
}

export function briefingRecipients(data: AppData, briefing: Briefing): Employee[] {
  return data.employees.filter((e) => isBriefingRecipient(briefing, e));
}

export function ackStats(data: AppData, briefing: Briefing) {
  const recipients = briefingRecipients(data, briefing);
  const acks = data.acknowledgements.filter((a) => a.briefingId === briefing.id);
  const ackMap = new Map(acks.map((a) => [a.employeeId, a.acknowledgedAt]));
  const acked = recipients
    .filter((e) => ackMap.has(e.id))
    .map((e) => ({ employee: e, at: ackMap.get(e.id)! }))
    .sort((a, b) => a.at.localeCompare(b.at));
  const pending = recipients.filter((e) => !ackMap.has(e.id));
  return {
    total: recipients.length,
    acked,
    pending,
    rate: recipients.length ? acked.length / recipients.length : 0,
  };
}

export function publishedBriefings(data: AppData): Briefing[] {
  return data.briefings
    .filter((b) => b.status === "published")
    .sort((a, b) => b.date.localeCompare(a.date) || (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}

/** Most recent published briefing dated today (or latest before today). */
export function todaysBriefing(data: AppData, forEmployee?: Employee): Briefing | undefined {
  const today = todayKey();
  const list = publishedBriefings(data).filter(
    (b) => b.date <= today && (!forEmployee || isBriefingRecipient(b, forEmployee)),
  );
  return list.find((b) => b.date === today) ?? list[0];
}

export function hasAcknowledged(data: AppData, briefingId: ID, employeeId: ID): boolean {
  return data.acknowledgements.some((a) => a.briefingId === briefingId && a.employeeId === employeeId);
}

// ───────────── Messages ─────────────

export function visibleThreads(data: AppData, employee: Employee): MessageThread[] {
  return data.threads
    .filter((t) => {
      if (t.kind === "announcement") return true;
      if (t.participantIds.includes(employee.id)) return true;
      // Owner has oversight of job and team conversations.
      if (employee.role === "admin" && (t.kind === "work_order" || t.kind === "team")) return true;
      if (employee.role === "supervisor" && t.kind === "work_order") {
        return workOrderById(data, t.workOrderId)?.supervisorId === employee.id;
      }
      return false;
    })
    .sort((a, b) => lastMessageAt(data, b.id).localeCompare(lastMessageAt(data, a.id)));
}

export function threadMessages(data: AppData, threadId: ID) {
  return data.messages.filter((m) => m.threadId === threadId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function lastMessage(data: AppData, threadId: ID) {
  const msgs = threadMessages(data, threadId);
  return msgs[msgs.length - 1];
}

function lastMessageAt(data: AppData, threadId: ID): string {
  return lastMessage(data, threadId)?.createdAt ?? data.threads.find((t) => t.id === threadId)?.createdAt ?? "";
}

export function unreadCount(data: AppData, employeeId: ID, threadId: ID): number {
  const readAt = data.threadReads[employeeId]?.[threadId] ?? "";
  return data.messages.filter((m) => m.threadId === threadId && m.senderId !== employeeId && m.createdAt > readAt).length;
}

export function totalUnread(data: AppData, employee: Employee): number {
  return visibleThreads(data, employee).reduce((n, t) => n + unreadCount(data, employee.id, t.id), 0);
}

export function threadTitle(data: AppData, thread: MessageThread, viewerId: ID): string {
  if (thread.title) return thread.title;
  if (thread.kind === "direct") {
    const other = thread.participantIds.find((p) => p !== viewerId) ?? thread.participantIds[0];
    return employeeName(data, other, "Conversation");
  }
  return "Conversation";
}

// ───────────── Dashboard KPIs ─────────────

export function dashboardKpis(data: AppData) {
  const wos = data.workOrders;
  const weekStart = startOfWeek();
  const briefing = todaysBriefing(data);
  const ack = briefing ? ackStats(data, briefing) : null;
  const assignedWorkers = new Set(
    wos.filter((w) => ["ready", "in_progress", "quality_check", "blocked"].includes(w.status) && w.assigneeId).map((w) => w.assigneeId),
  );
  const shopWorkers = data.employees.filter((e) => e.role === "worker" && e.active);
  return {
    active: wos.filter(isActive).length,
    dueToday: wos.filter(isDueToday).length,
    overdue: wos.filter(isOverdue).length,
    completedThisWeek: wos.filter((w) => w.status === "completed" && w.completedAt && new Date(w.completedAt) >= weekStart).length,
    blockedJobs: new Set(
      [
        ...wos.filter((w) => w.status === "blocked").map((w) => w.id),
        ...openBlockers(data).map((b) => b.workOrderId).filter(Boolean),
      ],
    ).size,
    openBlockers: openBlockers(data).length,
    workersAssigned: assignedWorkers.size,
    shopWorkers: shopWorkers.length,
    briefing,
    ack,
  };
}

// ───────────── Reports ─────────────

export function completedByWeek(data: AppData, weeks = 6) {
  const thisWeek = startOfWeek();
  return Array.from({ length: weeks }, (_, i) => {
    const start = addDays(thisWeek, -7 * (weeks - 1 - i));
    const end = addDays(start, 7);
    const count = data.workOrders.filter(
      (w) => w.status === "completed" && w.completedAt && new Date(w.completedAt) >= start && new Date(w.completedAt) < end,
    ).length;
    return { weekStart: toDateKey(start), count, isCurrent: i === weeks - 1 };
  });
}

export function countByStatus(data: AppData) {
  const statuses: WorkOrderStatus[] = [...PRODUCTION_FLOW.filter((s) => s !== "completed"), ...SECONDARY_STATUSES.filter((s) => s !== "cancelled")];
  return statuses.map((status) => ({ status, count: data.workOrders.filter((w) => w.status === status).length }));
}

export function blockerCategoryCounts(data: AppData) {
  const counts = new Map<BlockerCategory, number>();
  for (const b of data.blockers) counts.set(b.category, (counts.get(b.category) ?? 0) + 1);
  return [...counts.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
}

/** Average calendar days from creation to completion. Null if nothing completed. */
export function averageTurnaroundDays(data: AppData): { days: number; sample: number } | null {
  const done = data.workOrders.filter((w) => w.status === "completed" && w.completedAt);
  if (!done.length) return null;
  const total = done.reduce((s, w) => s + Math.max(0, (new Date(w.completedAt!).getTime() - new Date(w.createdAt).getTime()) / 86_400_000), 0);
  return { days: total / done.length, sample: done.length };
}

export function estimateAccuracy(data: AppData) {
  const done = data.workOrders.filter((w) => w.status === "completed" && w.actualHours !== undefined);
  const est = done.reduce((s, w) => s + w.estimatedHours, 0);
  const act = done.reduce((s, w) => s + (w.actualHours ?? 0), 0);
  return { estimated: est, actual: act, sample: done.length };
}

export function briefingAckRates(data: AppData, limit = 5) {
  return publishedBriefings(data)
    .slice(0, limit)
    .map((b) => ({ briefing: b, ...ackStats(data, b) }))
    .reverse();
}
