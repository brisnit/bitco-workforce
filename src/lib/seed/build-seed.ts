import { SCHEMA_VERSION } from "@/lib/domain/constants";
import type {
  AppData,
  Attachment,
  Blocker,
  Briefing,
  BriefingAcknowledgement,
  Message,
  MessageThread,
  WorkOrder,
  WorkOrderActivity,
  WorkOrderStatus,
} from "@/lib/domain/types";
import { addDays, startOfDay, toDateKey } from "@/lib/dates";
import { ORG_ID, customers, employees, locations, organization, teams } from "./people";
import { workOrderSeeds } from "./work-orders";

/**
 * Builds a complete, internally consistent demo dataset with all dates
 * relative to `now`. Called on first load and on "Reset demo data".
 */
export function buildSeedData(now: Date = new Date()): AppData {
  const today = startOfDay(now);
  /** ISO timestamp at day offset + time, clamped so nothing is in the future. */
  const at = (day: number, h = 9, m = 0): string => {
    const d = addDays(today, day);
    d.setHours(h, m, 0, 0);
    return (d.getTime() > now.getTime() && day >= 0 ? new Date(now.getTime() - 60_000 * (5 + h)) : d).toISOString();
  };
  const dateKey = (day: number) => toDateKey(addDays(today, day));
  /** n business days before today (0 = today). */
  const businessDay = (n: number): number => {
    let offset = 0;
    let remaining = n;
    while (remaining > 0) {
      offset -= 1;
      const dow = addDays(today, offset).getDay();
      if (dow !== 0 && dow !== 6) remaining -= 1;
    }
    return offset;
  };

  // ── Reference attachments (illustrative, not real BITCO documents) ──
  const attachments: Attachment[] = [
    ref("ref-tricone", "Tricone bit — reference sketch", "/reference/tricone-bit.svg"),
    ref("ref-adapter", "Adapter / sub — reference drawing", "/reference/adapter-drawing.svg"),
    ref("ref-hammer", "Hammer bit face — reference sketch", "/reference/hammer-bit.svg"),
    ref("ref-plate", "Fabrication plate — reference layout", "/reference/fab-plate.svg"),
  ];
  function ref(id: string, name: string, url: string): Attachment {
    return {
      id,
      orgId: ORG_ID,
      kind: "image",
      name,
      url,
      caption: "Illustrative reference for the demo — not a BITCO specification.",
      uploadedById: "emp-eran",
      createdAt: at(-40),
      isReference: true,
    };
  }

  // ── Work orders + generated lifecycle activity ──
  const workOrders: WorkOrder[] = [];
  const activities: WorkOrderActivity[] = [];
  let actSeq = 0;
  const act = (a: Omit<WorkOrderActivity, "id" | "orgId">) =>
    activities.push({ id: `act-${++actSeq}`, orgId: ORG_ID, ...a });

  for (const s of workOrderSeeds) {
    const id = `wo-${s.number}`;
    const createdBy = "emp-eran";
    const wo: WorkOrder = {
      id,
      orgId: ORG_ID,
      locationId: locations[0].id,
      number: `WO-${s.number}`,
      customerId: s.customerId,
      title: s.title,
      description: s.description,
      workType: s.workType,
      priority: s.priority,
      status: s.status,
      resumeStatus: s.resumeStatus,
      assigneeId: s.assigneeId,
      supervisorId: s.supervisorId,
      createdAt: at(s.created, 7, 30),
      createdById: createdBy,
      dueDate: dateKey(s.due),
      startedAt: s.started !== undefined ? at(s.started, 8, 10) : undefined,
      completedAt: s.completed !== undefined ? at(s.completed, 14, 45) : undefined,
      estimatedHours: s.estimatedHours,
      actualHours: s.actualHours,
      progress: s.progress,
      instructions: s.instructions,
      attachmentIds: s.reference ?? [],
      source: "office",
    };
    workOrders.push(wo);

    act({ workOrderId: id, actorId: createdBy, type: "created", message: "Work order created", createdAt: wo.createdAt, toStatus: "new" });
    const sup = s.supervisorId ?? "emp-eran";
    const reached = (st: WorkOrderStatus) => {
      const order: WorkOrderStatus[] = ["new", "ready", "in_progress", "quality_check", "completed"];
      const effective = s.resumeStatus ?? s.status;
      return order.indexOf(effective) >= order.indexOf(st);
    };
    if (s.assigneeId) {
      act({ workOrderId: id, actorId: sup, type: "assigned", message: `Assigned to ${name(s.assigneeId)}`, createdAt: at(s.created, 7, 45) });
    }
    if (reached("ready") && s.status !== "cancelled") {
      act({ workOrderId: id, actorId: sup, type: "status_changed", message: "Released to the shop", fromStatus: "new", toStatus: "ready", createdAt: at(s.created, 8, 0) });
    }
    if (reached("in_progress") && s.started !== undefined && s.assigneeId) {
      act({ workOrderId: id, actorId: s.assigneeId, type: "status_changed", message: "Started work", fromStatus: "ready", toStatus: "in_progress", createdAt: at(s.started, 8, 10) });
    }
    for (const n of s.notes ?? []) {
      act({ workOrderId: id, actorId: n.by, type: n.by === s.assigneeId ? "progress" : "note", message: n.text, createdAt: at(n.day, n.h, n.m) });
    }
    if (reached("quality_check") && s.assigneeId) {
      const qcDay = s.completed !== undefined ? s.completed : -1;
      act({ workOrderId: id, actorId: s.assigneeId, type: "status_changed", message: "Marked ready for Quality Check", fromStatus: "in_progress", toStatus: "quality_check", createdAt: at(qcDay, s.completed !== undefined ? 11 : 15, 30) });
    }
    if (s.status === "completed" && s.completed !== undefined) {
      act({ workOrderId: id, actorId: "emp-andre", type: "status_changed", message: "Passed inspection — completed", fromStatus: "quality_check", toStatus: "completed", createdAt: at(s.completed, 14, 45) });
    }
    if (s.status === "on_hold") {
      act({ workOrderId: id, actorId: sup, type: "status_changed", message: "Put on hold — waiting on customer drawing approval", fromStatus: "in_progress", toStatus: "on_hold", createdAt: at(-3, 10, 25) });
    }
    if (s.status === "cancelled") {
      act({ workOrderId: id, actorId: "emp-eran", type: "status_changed", message: "Cancelled — customer is replacing the bit", fromStatus: "new", toStatus: "cancelled", createdAt: at(-6, 11, 0) });
    }
  }

  // Hand-written, story-specific activity for today.
  act({ workOrderId: "wo-1042", actorId: "emp-marcus", type: "progress", message: "Cone 2 done. Starting cone 3 now — should be ready for QC early afternoon.", progress: 60, createdAt: at(0, 9, 40) });
  act({ workOrderId: "wo-1049", actorId: "emp-ben", type: "progress", message: "Collar 3 of 4 in progress. Wire feed acting up again.", progress: 70, createdAt: at(0, 8, 50) });
  act({ workOrderId: "wo-1041", actorId: "emp-hank", type: "progress", message: "Plate cut on the burn table. Fitting this morning.", progress: 30, createdAt: at(0, 8, 20) });
  act({ workOrderId: "wo-1040", actorId: "emp-hank", type: "status_changed", message: "Marked ready for Quality Check", fromStatus: "in_progress", toStatus: "quality_check", createdAt: at(0, 7, 55) });
  act({ workOrderId: "wo-1044", actorId: "emp-andre", type: "note", message: "Inspection scheduled before noon.", createdAt: at(0, 7, 35) });
  act({ workOrderId: "wo-1045", actorId: "emp-eran", type: "note", message: "Waiting on customer photos of the box threads before quoting.", createdAt: at(0, 7, 20) });

  // ── Blockers (3 open, 3 resolved) ──
  const blockers: Blocker[] = [
    {
      id: "blk-1", orgId: ORG_ID, workOrderId: "wo-1038", category: "missing_material", urgency: "high",
      description: "Out of carbide inserts for bits 2 and 3. Supplier order is backordered.",
      reportedById: "emp-marcus", reportedAt: at(-1, 13, 15), status: "open", attachmentIds: [],
    },
    {
      id: "blk-2", orgId: ORG_ID, workOrderId: "wo-1049", category: "equipment", urgency: "medium",
      description: "Hardbanding welder wire feed is inconsistent. Slowing down collar 3.",
      reportedById: "emp-ben", reportedAt: at(0, 8, 52), status: "open", attachmentIds: [],
    },
    {
      id: "blk-3", orgId: ORG_ID, workOrderId: "wo-1039", category: "clarification", urgency: "medium",
      description: "Drawing shows two different thread callouts for the pin end. Need the correct revision before finishing.",
      reportedById: "emp-tyler", reportedAt: at(-1, 14, 10), status: "open", attachmentIds: [],
    },
    {
      id: "blk-4", orgId: ORG_ID, workOrderId: "wo-1035", category: "tooling", urgency: "medium",
      description: "Button press die is chipped.",
      reportedById: "emp-jasmine", reportedAt: at(-3, 10, 5), status: "resolved",
      resolvedById: "emp-dale", resolvedAt: at(-3, 11, 30), resolutionNote: "Swapped in the spare die from the tool crib.", attachmentIds: [],
    },
    {
      id: "blk-5", orgId: ORG_ID, workOrderId: "wo-1033", category: "quality", urgency: "low",
      description: "Surface finish on the OD looks rough after first pass.",
      reportedById: "emp-tyler", reportedAt: at(-8, 13, 0), status: "resolved",
      resolvedById: "emp-rosa", resolvedAt: at(-8, 14, 20), resolutionNote: "Changed insert and adjusted feed rate. Finish acceptable.", attachmentIds: [],
    },
    {
      id: "blk-6", orgId: ORG_ID, workOrderId: "wo-1032", category: "missing_material", urgency: "high",
      description: "Brazing rod running low — not enough to finish.",
      reportedById: "emp-marcus", reportedAt: at(-14, 9, 30), status: "resolved",
      resolvedById: "emp-eran", resolvedAt: at(-14, 12, 0), resolutionNote: "Picked up from local supplier.", attachmentIds: [],
    },
  ];
  for (const b of blockers) {
    if (!b.workOrderId) continue;
    act({ workOrderId: b.workOrderId, actorId: b.reportedById, type: "blocker_reported", message: `Reported problem: ${b.description}`, createdAt: b.reportedAt });
    if (b.status === "resolved" && b.resolvedById && b.resolvedAt) {
      act({ workOrderId: b.workOrderId, actorId: b.resolvedById, type: "blocker_resolved", message: `Problem resolved: ${b.resolutionNote}`, createdAt: b.resolvedAt });
    }
  }
  act({ workOrderId: "wo-1038", actorId: "emp-dale", type: "status_changed", message: "Blocked — waiting on carbide inserts", fromStatus: "in_progress", toStatus: "blocked", createdAt: at(-1, 13, 30) });

  // ── Briefings (5 published) + acknowledgements ──
  const recipients = employees.filter((e) => e.role !== "admin").map((e) => e.id);
  const briefings: Briefing[] = [];
  const acknowledgements: BriefingAcknowledgement[] = [];
  const briefingSeeds: {
    n: number;
    title: string;
    message: string;
    priorities: string[];
    safety: string[];
    equipment: string[];
    announcements: string[];
    special: string[];
    acked: string[];
  }[] = [
    {
      n: 0,
      title: "Get Mesa Valley & Sierra Well jobs out the door",
      message:
        "Morning, team. Two customer pickups this afternoon. Finish what's in progress before starting anything new, and flag anything holding you up early so we can fix it before lunch.",
      priorities: [
        'WO-1042 — Finish the 12¼" retip for Mesa Valley. Pickup at 3:00 PM.',
        "WO-1044 — Sierra Well reconditioning needs QC sign-off by noon.",
        "WO-1039 — Keep the sub adapters moving. Rosa is getting the drawing answer this morning.",
      ],
      safety: [
        "Face shields on at the grinders — no exceptions.",
        "Keep the aisle by the brazing station clear. Forklift delivery around 10:00.",
      ],
      equipment: [
        "CNC mill #2 is back in service after the coolant pump repair.",
        "Hardbanding welder: wire feed is being looked at. Check with Dale before using it.",
      ],
      announcements: ["Shop meeting Monday 6:45 AM in the break room.", "Carbide insert order is backordered — Dale is checking an alternate supplier."],
      special: ["wo-1042", "wo-1044", "wo-1039"],
      acked: ["emp-dale", "emp-rosa", "emp-tyler", "emp-jasmine", "emp-andre", "emp-kayla"],
    },
    {
      n: 1,
      title: "Rush hole opener coming in",
      message: "Granite Pass is sending a 26\" hole opener as a rush. Jasmine will lead it. Everyone else stay on your current jobs.",
      priorities: ["WO-1042 — Cones 1 and 2 today.", "WO-1049 — Finish collar 3.", "WO-1040 — Wrap up the stabilizer rebuild for QC."],
      safety: ["Use the lifting strap — not chain — on the hole opener."],
      equipment: ["CNC mill #2 down for coolant pump repair. Use mill #1."],
      announcements: [],
      special: ["wo-1042", "wo-1048"],
      acked: ["emp-dale", "emp-rosa", "emp-marcus", "emp-tyler", "emp-jasmine", "emp-ben", "emp-hank", "emp-andre", "emp-kayla"],
    },
    {
      n: 2,
      title: "Clean up the QC rack",
      message: "Quality rack is full. Andre needs everything tagged with the work order number before he inspects it.",
      priorities: ["Tag every part on the QC rack.", "WO-1039 — Start the sub adapters."],
      safety: ["Report any frayed slings to Dale today."],
      equipment: [],
      announcements: ["Payroll questions go to the office — not the floor supervisors."],
      special: ["wo-1039"],
      acked: ["emp-dale", "emp-rosa", "emp-marcus", "emp-tyler", "emp-jasmine", "emp-ben", "emp-hank", "emp-andre", "emp-kayla", "emp-luis"],
    },
    {
      n: 3,
      title: "Short week reminder",
      message: "Lots of work coming in this week. Keep updates in the app so the office can answer customer calls without walking the floor.",
      priorities: ["WO-1038 — Start the Kern River retips.", "WO-1035 — Hammer bit face repair for Desert Ridge."],
      safety: ["Hearing protection required near the air compressor."],
      equipment: ["New brazing torch tips are in the tool crib."],
      announcements: [],
      special: ["wo-1038", "wo-1035"],
      acked: ["emp-dale", "emp-rosa", "emp-marcus", "emp-jasmine", "emp-ben", "emp-hank", "emp-andre", "emp-luis"],
    },
    {
      n: 4,
      title: "Welcome to BITCO Workforce",
      message: "Starting today, the morning briefing will be posted here. Read it, tap \"Got it,\" and use the app to update your jobs and report problems.",
      priorities: ["Make sure every open job has an update by end of day."],
      safety: ["Stop work and tell your supervisor about anything unsafe. Do not rely on the app for safety issues."],
      equipment: [],
      announcements: ["Ask Dale or Rosa if you need help with the app."],
      special: [],
      acked: ["emp-dale", "emp-rosa", "emp-marcus", "emp-tyler", "emp-jasmine", "emp-ben", "emp-hank", "emp-andre", "emp-kayla"],
    },
  ];
  for (const b of briefingSeeds) {
    const offset = businessDay(b.n);
    const id = `brf-${b.n + 1}`;
    briefings.push({
      id,
      orgId: ORG_ID,
      date: dateKey(offset),
      title: b.title,
      message: b.message,
      priorities: b.priorities,
      safetyReminders: b.safety,
      equipmentUpdates: b.equipment,
      announcements: b.announcements,
      specialAttentionWorkOrderIds: b.special,
      audience: { type: "all" },
      status: "published",
      authorId: "emp-eran",
      createdAt: at(offset - 1, 17, 30),
      updatedAt: at(offset, 6, 20),
      publishedAt: at(offset, 6, 25),
    });
    b.acked
      .filter((e) => recipients.includes(e))
      .forEach((e, i) =>
        acknowledgements.push({ id: `ack-${id}-${e}`, briefingId: id, employeeId: e, acknowledgedAt: at(offset, 6, 40 + i * 4) }),
      );
  }

  // ── Message threads (12) ──
  const threads: MessageThread[] = [];
  const messages: Message[] = [];
  let msgSeq = 0;
  const thread = (t: Omit<MessageThread, "orgId" | "createdAt">, msgs: [string, number, number, number, string, string?][]) => {
    threads.push({ orgId: ORG_ID, createdAt: at(-20), ...t });
    for (const [sender, day, h, m, body, wo] of msgs) {
      messages.push({ id: `msg-${++msgSeq}`, threadId: t.id, senderId: sender, createdAt: at(day, h, m), body, workOrderId: wo });
    }
  };

  thread({ id: "th-announce", kind: "announcement", title: "Shop Announcements", participantIds: [] }, [
    ["emp-eran", -4, 6, 30, "Welcome to BITCO Workforce. Morning briefings, job updates and problem reports all live here now."],
    ["emp-dale", -2, 12, 5, "Reminder: tag every part on the QC rack with its work order number."],
    ["emp-rosa", 0, 6, 50, "CNC mill #2 is back up. Thanks for your patience this week."],
  ]);
  thread({ id: "th-eran-marcus", kind: "direct", participantIds: ["emp-eran", "emp-marcus"] }, [
    ["emp-eran", 0, 6, 35, "Marcus, please prioritize WO-1042 today.", "wo-1042"],
    ["emp-marcus", 0, 6, 42, "Got it. I'll start as soon as the current job is cleared."],
    ["emp-eran", 0, 6, 44, "Thanks. Let me know if you need additional materials."],
  ]);
  thread({ id: "th-wo-1042", kind: "work_order", workOrderId: "wo-1042", title: "WO-1042 · Tricone Bit Retipping", participantIds: ["emp-marcus", "emp-dale", "emp-eran", "emp-andre"] }, [
    ["emp-dale", -1, 8, 15, "Mesa Valley wants it by 3:00 tomorrow. Cones look clean — no bearing issues.", "wo-1042"],
    ["emp-marcus", -1, 15, 42, "Cone 1 done.", "wo-1042"],
    ["emp-andre", 0, 7, 30, "I'll keep an inspection slot open at 1:30 for this one.", "wo-1042"],
    ["emp-marcus", 0, 9, 41, "Cone 2 done, starting 3.", "wo-1042"],
  ]);
  thread({ id: "th-dale-marcus", kind: "direct", participantIds: ["emp-dale", "emp-marcus"] }, [
    ["emp-marcus", -1, 13, 10, "We're out of inserts for the Kern River bits."],
    ["emp-dale", -1, 13, 25, "I see it. I'm calling the alternate supplier. Move to WO-1042 in the meantime.", "wo-1038"],
    ["emp-marcus", -1, 13, 27, "Will do."],
  ]);
  thread({ id: "th-wo-1038", kind: "work_order", workOrderId: "wo-1038", title: "WO-1038 · Retip 7⅞\" Tricone Bits", participantIds: ["emp-marcus", "emp-dale", "emp-eran"] }, [
    ["emp-dale", -1, 13, 35, "Marked blocked until inserts arrive. First bit is tagged and on the rack.", "wo-1038"],
    ["emp-eran", -1, 16, 0, "Kern River is OK with Wednesday if needed. I'll let them know.", "wo-1038"],
  ]);
  thread({ id: "th-wo-1039", kind: "work_order", workOrderId: "wo-1039", title: "WO-1039 · CNC Bit Sub Adapters", participantIds: ["emp-tyler", "emp-rosa", "emp-eran"] }, [
    ["emp-tyler", -1, 14, 12, "Drawing has two thread callouts for the pin end. Which one is right?", "wo-1039"],
    ["emp-rosa", -1, 14, 40, "Good catch. I emailed Sunbelt — will have an answer first thing.", "wo-1039"],
    ["emp-rosa", 0, 7, 10, "Still waiting on Sunbelt. Keep roughing the other three in the meantime.", "wo-1039"],
  ]);
  thread({ id: "th-wo-1044", kind: "work_order", workOrderId: "wo-1044", title: "WO-1044 · Drill Bit Reconditioning", participantIds: ["emp-jasmine", "emp-andre", "emp-dale"] }, [
    ["emp-jasmine", -1, 15, 50, "Done and on the QC rack.", "wo-1044"],
    ["emp-andre", 0, 7, 35, "Inspecting before noon.", "wo-1044"],
  ]);
  thread({ id: "th-eran-dale", kind: "direct", participantIds: ["emp-eran", "emp-dale"] }, [
    ["emp-eran", 0, 6, 15, "Can we get the Granite Pass hole opener started today?", "wo-1048"],
    ["emp-dale", 0, 6, 28, "Jasmine is on it once 1044 clears QC."],
  ]);
  thread({ id: "th-eran-rosa", kind: "direct", participantIds: ["emp-eran", "emp-rosa"] }, [
    ["emp-rosa", -1, 16, 30, "Granite Pass hole opener body is on hold until they approve the drawing.", "wo-1037"],
    ["emp-eran", -1, 16, 45, "Understood. I'll follow up with them in the morning."],
  ]);
  thread({ id: "th-wo-1049", kind: "work_order", workOrderId: "wo-1049", title: "WO-1049 · Hardband Drill Collars", participantIds: ["emp-ben", "emp-dale"] }, [
    ["emp-ben", 0, 8, 53, "Wire feed is skipping again. Reported it in the app.", "wo-1049"],
    ["emp-dale", 0, 9, 5, "I'll look at the drive rolls after break. Keep going slow if it's safe.", "wo-1049"],
  ]);
  thread({ id: "th-team-machining", kind: "team", teamId: "team-machining", title: "Machining Team", participantIds: ["emp-rosa", "emp-tyler", "emp-kayla", "emp-luis"] }, [
    ["emp-rosa", -2, 7, 0, "Mill #2 is down for the coolant pump. Coordinate time on mill #1."],
    ["emp-kayla", -2, 7, 12, "I'll take the afternoon slot on mill #1."],
    ["emp-rosa", 0, 6, 52, "Mill #2 is back. Kayla — WO-1043 material is on cart 3.", "wo-1043"],
  ]);
  thread({ id: "th-dale-jasmine", kind: "direct", participantIds: ["emp-dale", "emp-jasmine"] }, [
    ["emp-dale", -1, 10, 0, "You're lead on the 26\" hole opener rush.", "wo-1048"],
    ["emp-jasmine", -1, 10, 6, "Sounds good. I'll start once 1044 is through QC."],
  ]);

  return {
    schemaVersion: SCHEMA_VERSION,
    seededAt: now.toISOString(),
    organization,
    locations,
    teams,
    employees,
    customers,
    workOrders,
    activities,
    attachments,
    blockers,
    briefings,
    acknowledgements,
    threads,
    messages,
    // Everyone has read everything up to the start of today's shift (06:30);
    // only newer messages show as unread.
    threadReads: Object.fromEntries(
      employees.map((e) => [e.id, Object.fromEntries(threads.map((t) => [t.id, at(0, e.role === "admin" ? 7 : 6, 30)]))]),
    ),
    session: { role: "admin", employeeId: "emp-eran" },
  };
}

function name(id: string): string {
  const e = employees.find((x) => x.id === id);
  return e ? `${e.firstName} ${e.lastName}`.trim() : "Unknown";
}
