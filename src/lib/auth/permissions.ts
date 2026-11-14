/**
 * Centralized role & permission rules.
 *
 * ⚠️  In this prototype the role comes from a DEMO ROLE SWITCHER held in the
 * browser. These checks only shape the UI — they are NOT security controls.
 * When real authentication is added, the same rules must be enforced on the
 * server (e.g. Postgres row-level security or API middleware).
 */
import type { Role, WorkOrder, WorkOrderStatus } from "@/lib/domain/types";

export type Permission =
  | "dashboard.view"
  | "workerApp.view"
  | "briefing.manage"
  | "briefing.acknowledge"
  | "workOrder.create"
  | "workOrder.edit"
  | "workOrder.assign"
  | "workOrder.changePriority"
  | "workOrder.cancel"
  | "workOrder.approveQuality"
  | "production.move"
  | "blocker.report"
  | "blocker.resolve"
  | "team.view"
  | "team.manage"
  | "reports.view"
  | "settings.view"
  | "announcement.send"
  | "message.send";

const MATRIX: Record<Role, ReadonlySet<Permission>> = {
  admin: new Set<Permission>([
    "dashboard.view",
    "briefing.manage",
    "workOrder.create",
    "workOrder.edit",
    "workOrder.assign",
    "workOrder.changePriority",
    "workOrder.cancel",
    "workOrder.approveQuality",
    "production.move",
    "blocker.report",
    "blocker.resolve",
    "team.view",
    "team.manage",
    "reports.view",
    "settings.view",
    "announcement.send",
    "message.send",
  ]),
  supervisor: new Set<Permission>([
    "dashboard.view",
    "workOrder.create",
    "workOrder.edit",
    "workOrder.assign",
    "workOrder.changePriority",
    "workOrder.approveQuality",
    "production.move",
    "blocker.report",
    "blocker.resolve",
    "team.view",
    "settings.view",
    "announcement.send",
    "message.send",
  ]),
  worker: new Set<Permission>([
    "workerApp.view",
    "briefing.acknowledge",
    "blocker.report",
    "message.send",
  ]),
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role].has(permission);
}

/**
 * Worker-permitted status moves. Workers can never mark a job Completed —
 * that requires a supervisor/admin quality sign-off.
 */
const WORKER_TRANSITIONS: Partial<Record<WorkOrderStatus, WorkOrderStatus[]>> = {
  ready: ["in_progress"],
  in_progress: ["quality_check"],
};

export interface TransitionCheck {
  allowed: boolean;
  /** Reason shown in the UI when not allowed. */
  reason?: string;
  /** Non-blocking warning that needs explicit confirmation. */
  warning?: string;
}

export function checkTransition(
  role: Role,
  workOrder: Pick<WorkOrder, "status" | "assigneeId">,
  to: WorkOrderStatus,
  actorId?: string,
): TransitionCheck {
  const from = workOrder.status;
  if (from === to) return { allowed: false, reason: "Already in this status." };

  if (role === "worker") {
    if (workOrder.assigneeId !== actorId) {
      return { allowed: false, reason: "Only the assigned worker can update this job." };
    }
    if (to === "completed") {
      return {
        allowed: false,
        reason: "Jobs must pass Quality Check. A supervisor signs off completed work.",
      };
    }
    if (!(WORKER_TRANSITIONS[from] ?? []).includes(to)) {
      return { allowed: false, reason: "Ask your supervisor to make this change." };
    }
    return { allowed: true };
  }

  if (to === "cancelled" && !can(role, "workOrder.cancel")) {
    return { allowed: false, reason: "Only the owner/admin can cancel a work order." };
  }
  if (to === "completed" && from !== "quality_check") {
    return {
      allowed: true,
      warning: "This skips the Quality Check stage. Only do this if the job was inspected.",
    };
  }
  if (from === "completed" || from === "cancelled") {
    return { allowed: true, warning: "This reopens a closed work order." };
  }
  if ((to === "in_progress" || to === "ready") && !workOrder.assigneeId && to === "in_progress") {
    return { allowed: true, warning: "No worker is assigned to this job yet." };
  }
  return { allowed: true };
}

/** The next "primary" action available to a worker for a given job. */
export function workerPrimaryAction(
  status: WorkOrderStatus,
): { to: WorkOrderStatus; label: string } | null {
  if (status === "ready") return { to: "in_progress", label: "Start job" };
  if (status === "in_progress") return { to: "quality_check", label: "Ready for QC" };
  return null;
}

export function homePathForRole(role: Role): string {
  return role === "worker" ? "/worker" : "/dashboard";
}
