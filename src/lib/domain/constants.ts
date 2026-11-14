import type {
  BlockerCategory,
  BlockerUrgency,
  Priority,
  Role,
  WorkOrderStatus,
  WorkStatus,
  WorkType,
} from "./types";

/** Primary production flow, in order. */
export const PRODUCTION_FLOW: WorkOrderStatus[] = [
  "new",
  "ready",
  "in_progress",
  "quality_check",
  "completed",
];

/** Secondary queues shown outside the main flow. */
export const SECONDARY_STATUSES: WorkOrderStatus[] = ["blocked", "on_hold", "cancelled"];

export const ALL_STATUSES: WorkOrderStatus[] = [...PRODUCTION_FLOW, ...SECONDARY_STATUSES];

/** Statuses that count as open/active work. */
export const ACTIVE_STATUSES: WorkOrderStatus[] = [
  "new",
  "ready",
  "in_progress",
  "quality_check",
  "on_hold",
  "blocked",
];

export const STATUS_META: Record<
  WorkOrderStatus,
  { label: string; short: string; tone: string; dot: string; description: string }
> = {
  new: {
    label: "New",
    short: "New",
    tone: "bg-slate-100 text-slate-700 ring-slate-300/70",
    dot: "bg-slate-400",
    description: "Created by the office. Not yet released to the shop.",
  },
  ready: {
    label: "Ready for Shop",
    short: "Ready",
    tone: "bg-sky-50 text-ocean ring-sky-300/70",
    dot: "bg-cyan",
    description: "Released to the shop floor and ready to start.",
  },
  in_progress: {
    label: "In Progress",
    short: "In Progress",
    tone: "bg-orange-50 text-orange-800 ring-orange-300/80",
    dot: "bg-orange",
    description: "Actively being worked on.",
  },
  quality_check: {
    label: "Quality Check",
    short: "QC",
    tone: "bg-violet-50 text-violet-800 ring-violet-300/70",
    dot: "bg-violet-500",
    description: "Work done — waiting for inspection and sign-off.",
  },
  completed: {
    label: "Completed",
    short: "Done",
    tone: "bg-emerald-50 text-emerald-800 ring-emerald-300/70",
    dot: "bg-emerald-500",
    description: "Passed quality check and closed out.",
  },
  on_hold: {
    label: "On Hold",
    short: "On Hold",
    tone: "bg-stone-100 text-stone-700 ring-stone-300/80",
    dot: "bg-stone-400",
    description: "Paused — waiting on the customer or the office.",
  },
  blocked: {
    label: "Blocked",
    short: "Blocked",
    tone: "bg-red-50 text-red-700 ring-red-300/80",
    dot: "bg-red-500",
    description: "Work stopped by a reported problem.",
  },
  cancelled: {
    label: "Cancelled",
    short: "Cancelled",
    tone: "bg-zinc-100 text-zinc-500 ring-zinc-300/70",
    dot: "bg-zinc-300",
    description: "Will not be completed.",
  },
};

export const PRIORITY_ORDER: Priority[] = ["rush", "high", "medium", "normal"];

export const PRIORITY_META: Record<
  Priority,
  { label: string; rank: number; tone: string; bar: string }
> = {
  rush: { label: "Rush", rank: 0, tone: "bg-red-600 text-white ring-red-700", bar: "bg-red-600" },
  high: { label: "High", rank: 1, tone: "bg-orange text-ink ring-orange-600", bar: "bg-orange" },
  medium: { label: "Medium", rank: 2, tone: "bg-amber-100 text-amber-900 ring-amber-300", bar: "bg-amber" },
  normal: { label: "Normal", rank: 3, tone: "bg-slate-100 text-slate-700 ring-slate-300", bar: "bg-slate-300" },
};

export const WORK_TYPE_LABEL: Record<WorkType, string> = {
  retipping: "Bit Retipping",
  bit_repair: "Bit Repair",
  reconditioning: "Reconditioning",
  custom_machining: "Custom Machining",
  fabrication: "Metal Fabrication",
  general_repair: "General Repair",
};

export const BLOCKER_CATEGORY_LABEL: Record<BlockerCategory, string> = {
  missing_material: "Missing material",
  equipment: "Equipment issue",
  tooling: "Tooling issue",
  clarification: "Need clarification",
  quality: "Quality concern",
  safety: "Safety concern",
  other: "Other",
};

export const BLOCKER_URGENCY_META: Record<
  BlockerUrgency,
  { label: string; hint: string; tone: string }
> = {
  low: { label: "Low", hint: "I can keep working", tone: "bg-slate-100 text-slate-700 ring-slate-300" },
  medium: { label: "Medium", hint: "It's slowing me down", tone: "bg-amber-100 text-amber-900 ring-amber-300" },
  high: { label: "High", hint: "Work is stopped", tone: "bg-red-600 text-white ring-red-700" },
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin / Owner",
  supervisor: "Shop Supervisor",
  worker: "Shop Worker",
};

export const WORK_STATUS_META: Record<WorkStatus, { label: string; dot: string }> = {
  available: { label: "Available", dot: "bg-emerald-500" },
  on_job: { label: "On a job", dot: "bg-orange" },
  off_today: { label: "Off today", dot: "bg-zinc-300" },
};

export const STORAGE_KEY = "bitco-workforce:v1";
export const SCHEMA_VERSION = 4;
