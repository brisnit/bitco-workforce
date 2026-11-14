/**
 * BITCO Workforce — domain model.
 *
 * These interfaces are the contract between UI and data. They are intentionally
 * backend-agnostic: today they are persisted to browser storage by
 * `LocalStorageRepository`; later they can map 1:1 onto database tables
 * (Supabase/Postgres) without changing UI components.
 *
 * Every top-level record carries `orgId` (and work orders carry `locationId`) so
 * multiple shops/locations can be supported later without a rewrite.
 */

export type ID = string;
/** ISO-8601 timestamp string. */
export type ISODate = string;

// ───────────────────────────── Organization ─────────────────────────────

export interface Organization {
  id: ID;
  name: string;
}

export interface Location {
  id: ID;
  orgId: ID;
  name: string;
  city: string;
}

// ───────────────────────────── People ─────────────────────────────

/** Demo roles. Role switching is SIMULATED and is not secure authorization. */
export type Role = "admin" | "supervisor" | "worker";

export type Position =
  | "Owner"
  | "Shop Supervisor"
  | "Machinist"
  | "CNC Operator"
  | "Repair Technician"
  | "Fabricator"
  | "Quality Inspector";

/** Self-reported availability. Not tracking or surveillance data. */
export type WorkStatus = "available" | "on_job" | "off_today";

export interface Team {
  id: ID;
  orgId: ID;
  name: string;
  supervisorId: ID | null;
  description: string;
}

export interface Employee {
  id: ID;
  orgId: ID;
  /** Application user role (permissions). */
  role: Role;
  firstName: string;
  lastName: string;
  position: Position;
  teamId: ID | null;
  supervisorId: ID | null;
  workStatus: WorkStatus;
  phone?: string;
  startedOn?: ISODate;
  /** Optional photo URL; initials are used when absent. */
  avatarUrl?: string;
  skills: string[];
  active: boolean;
}

/** A future `User` (login identity) links to an `Employee`. */
export interface User {
  id: ID;
  employeeId: ID;
  email: string;
}

export interface Customer {
  id: ID;
  orgId: ID;
  name: string;
  kind: "external" | "internal";
  contactName?: string;
}

// ───────────────────────────── Work orders ─────────────────────────────

export type WorkOrderStatus =
  | "new"
  | "ready"
  | "in_progress"
  | "quality_check"
  | "completed"
  | "on_hold"
  | "blocked"
  | "cancelled";

export type Priority = "rush" | "high" | "medium" | "normal";

export type WorkType =
  | "retipping"
  | "bit_repair"
  | "reconditioning"
  | "custom_machining"
  | "fabrication"
  | "general_repair";

export interface WorkOrder {
  id: ID;
  orgId: ID;
  locationId: ID;
  /** Human-facing number, e.g. WO-1042. */
  number: string;
  customerId: ID;
  title: string;
  description: string;
  workType: WorkType;
  priority: Priority;
  status: WorkOrderStatus;
  /** Status before the job was put on hold / blocked, used to resume. */
  resumeStatus?: WorkOrderStatus;
  assigneeId: ID | null;
  supervisorId: ID | null;
  createdAt: ISODate;
  createdById: ID;
  dueDate: ISODate;
  startedAt?: ISODate;
  completedAt?: ISODate;
  estimatedHours: number;
  actualHours?: number;
  /** 0–100, worker-reported. */
  progress: number;
  instructions: string[];
  attachmentIds: ID[];
  /** Origin of the job. `website_intake` is reserved for the future integration. */
  source: "office" | "website_intake";
  intakeRequestId?: ID;
}

export type ActivityType =
  | "created"
  | "edited"
  | "status_changed"
  | "assigned"
  | "priority_changed"
  | "progress"
  | "note"
  | "photo"
  | "blocker_reported"
  | "blocker_resolved";

export interface WorkOrderActivity {
  id: ID;
  orgId: ID;
  workOrderId: ID;
  actorId: ID;
  type: ActivityType;
  message: string;
  fromStatus?: WorkOrderStatus;
  toStatus?: WorkOrderStatus;
  progress?: number;
  attachmentIds?: ID[];
  createdAt: ISODate;
}

// ───────────────────────────── Attachments ─────────────────────────────

export interface Attachment {
  id: ID;
  orgId: ID;
  kind: "image";
  name: string;
  /** Public URL or compressed data URL (prototype only). */
  url: string;
  caption?: string;
  uploadedById: ID;
  createdAt: ISODate;
  /** True for seeded illustrative references — not real BITCO documents. */
  isReference?: boolean;
}

// ───────────────────────────── Blockers ─────────────────────────────

export type BlockerCategory =
  | "missing_material"
  | "equipment"
  | "tooling"
  | "clarification"
  | "quality"
  | "safety"
  | "other";

/** low = can keep working, medium = slowing me down, high = work stopped. */
export type BlockerUrgency = "low" | "medium" | "high";

export interface Blocker {
  id: ID;
  orgId: ID;
  workOrderId: ID | null;
  category: BlockerCategory;
  urgency: BlockerUrgency;
  description: string;
  reportedById: ID;
  reportedAt: ISODate;
  status: "open" | "resolved";
  resolvedById?: ID;
  resolvedAt?: ISODate;
  resolutionNote?: string;
  attachmentIds: ID[];
}

// ───────────────────────────── Briefings ─────────────────────────────

export type BriefingAudience =
  | { type: "all" }
  | { type: "team"; teamIds: ID[] }
  | { type: "employees"; employeeIds: ID[] };

export interface Briefing {
  id: ID;
  orgId: ID;
  /** Calendar date (YYYY-MM-DD) the briefing is for. */
  date: string;
  title: string;
  message: string;
  priorities: string[];
  safetyReminders: string[];
  equipmentUpdates: string[];
  announcements: string[];
  specialAttentionWorkOrderIds: ID[];
  audience: BriefingAudience;
  status: "draft" | "published";
  authorId: ID;
  createdAt: ISODate;
  updatedAt: ISODate;
  publishedAt?: ISODate;
}

/**
 * Records that a worker tapped "Got it". This is a read receipt —
 * NOT a legal, training or safety certification.
 */
export interface BriefingAcknowledgement {
  id: ID;
  briefingId: ID;
  employeeId: ID;
  acknowledgedAt: ISODate;
}

// ───────────────────────────── Messages ─────────────────────────────

export type ThreadKind = "direct" | "work_order" | "announcement" | "team";

export interface MessageThread {
  id: ID;
  orgId: ID;
  kind: ThreadKind;
  title?: string;
  /** For `announcement` threads, everyone in the org can read. */
  participantIds: ID[];
  workOrderId?: ID;
  teamId?: ID;
  createdAt: ISODate;
}

export interface Message {
  id: ID;
  threadId: ID;
  senderId: ID;
  body: string;
  createdAt: ISODate;
  /** Optional work order this message references. */
  workOrderId?: ID;
  attachmentIds?: ID[];
}

/** Per-employee read pointer (prototype-only unread counts). */
export type ThreadReads = Record<ID, Record<ID, ISODate>>;

// ───────────────────────────── App state ─────────────────────────────

export interface DemoSession {
  role: Role;
  employeeId: ID;
}

export interface AppData {
  schemaVersion: number;
  seededAt: ISODate;
  organization: Organization;
  locations: Location[];
  teams: Team[];
  employees: Employee[];
  customers: Customer[];
  workOrders: WorkOrder[];
  activities: WorkOrderActivity[];
  attachments: Attachment[];
  blockers: Blocker[];
  briefings: Briefing[];
  acknowledgements: BriefingAcknowledgement[];
  threads: MessageThread[];
  messages: Message[];
  threadReads: ThreadReads;
  session: DemoSession;
}
