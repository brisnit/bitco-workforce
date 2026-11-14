/**
 * FUTURE INTEGRATION — BITCO website service requests.
 *
 * Not active in this prototype. This file documents the contract so the
 * website and Workforce can be connected later without reshaping either app.
 *
 *   CUSTOMER REQUEST  →  OFFICE REVIEW  →  SHOP WORK ORDER
 *
 * Rules:
 * 1. Website submissions land in a protected office intake queue.
 * 2. They NEVER become shop-floor instructions automatically.
 * 3. An authorized admin reviews, edits and explicitly approves each request
 *    before a `WorkOrder` is created (`source: "website_intake"`).
 * 4. Only approved, customer-safe status updates are ever sent back.
 */
import type { ID, ISODate, Priority, WorkType } from "@/lib/domain/types";

export type IntakeStatus = "submitted" | "in_review" | "approved" | "declined";

export interface CustomerServiceRequest {
  id: ID;
  submittedAt: ISODate;
  customerName: string;
  company: string;
  email: string;
  phone?: string;
  requestedService: WorkType;
  toolDescription: string;
  photoUrls: string[];
  requestedCompletionDate?: string;
  additionalInstructions?: string;
  status: IntakeStatus;
  reviewedById?: ID;
  reviewNotes?: string;
  workOrderId?: ID;
}

/** Office decision captured during review — required before a job exists. */
export interface IntakeApproval {
  requestId: ID;
  approvedById: ID;
  customerId: ID;
  title: string;
  priority: Priority;
  assigneeId: ID | null;
  supervisorId: ID | null;
  dueDate: string;
  instructions: string[];
}

/** Customer-safe status values that could be shared externally later. */
export type CustomerFacingStatus = "received" | "in_shop" | "quality_check" | "ready_for_pickup";

export interface WebsiteIntakeAdapter {
  /** Pull new requests from the website (webhook or polling). */
  listPending(): Promise<CustomerServiceRequest[]>;
  /** Mark reviewed; creating the work order happens in Workforce, not here. */
  markReviewed(requestId: ID, decision: "approved" | "declined", notes?: string): Promise<void>;
  /** Push an approved, customer-safe status update back to the website. */
  publishCustomerStatus(requestId: ID, status: CustomerFacingStatus): Promise<void>;
}

/** Sample requests shown on the Future Integrations page (illustrative only). */
export const sampleIntakeRequests: CustomerServiceRequest[] = [
  {
    id: "req-2201",
    submittedAt: "2026-01-01T15:10:00.000Z",
    customerName: "Sample Customer",
    company: "Example Water Wells Co.",
    email: "customer@example.com",
    requestedService: "retipping",
    toolDescription: 'Two 9⅞" tricone bits, worn inserts on gauge row.',
    photoUrls: [],
    requestedCompletionDate: undefined,
    additionalInstructions: "Will drop off Monday morning.",
    status: "submitted",
  },
  {
    id: "req-2202",
    submittedAt: "2026-01-01T17:42:00.000Z",
    customerName: "Sample Customer",
    company: "Example Geothermal LLC",
    email: "ops@example.com",
    requestedService: "custom_machining",
    toolDescription: "Need a crossover sub machined. Drawing attached.",
    photoUrls: [],
    status: "in_review",
  },
];

/** Placeholder: there is no live connection in the prototype. */
export const websiteIntakeAdapter: WebsiteIntakeAdapter | null = null;
