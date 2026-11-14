"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, MessageSquare, Phone, UserRound } from "lucide-react";
import { ROLE_LABEL, WORK_STATUS_META } from "@/lib/domain/constants";
import { formatShortYear } from "@/lib/dates";
import { actions, useData } from "@/lib/store/app-store";
import { employeeById, employeeName, fullName, hasAcknowledged, publishedBriefings, teamName, workOrdersForEmployee } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/shared/panel";
import { EmptyState } from "@/components/shared/empty-state";
import { EmployeeAvatar } from "@/components/shared/employee-avatar";
import { ActivityFeed } from "@/components/work-orders/activity-feed";
import { WorkOrderRow } from "@/components/work-orders/work-order-row";

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const data = useData();
  const router = useRouter();
  const e = employeeById(data, id);
  if (!e) return <div className="p-6"><EmptyState icon={UserRound} title="Employee not found" /></div>;

  const jobs = workOrdersForEmployee(data, e.id);
  const open = jobs.filter((w) => !["completed", "cancelled"].includes(w.status));
  const done = jobs.filter((w) => w.status === "completed");
  const recent = data.activities.filter((a) => a.actorId === e.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  const reports = data.employees.filter((x) => x.supervisorId === e.id && x.active);
  const latestBriefing = publishedBriefings(data)[0];
  const me = data.session.employeeId;

  return (
    <div className="mx-auto max-w-[1280px] space-y-5 p-4 sm:p-6">
      <Link href="/dashboard/team" className="inline-flex items-center gap-1.5 text-sm font-medium text-steel-600 hover:text-navy">
        <ArrowLeft className="size-4" /> Team
      </Link>
      <div className="flex flex-col gap-5 rounded-xl border bg-card p-5 sm:flex-row sm:items-center">
        <EmployeeAvatar employee={e} size="xl" showStatus />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-extrabold text-navy">{fullName(e)}</h1>
          <p className="text-steel-600">
            {e.position} · {e.teamId ? teamName(data, e.teamId) : "Office"}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", WORK_STATUS_META[e.workStatus].dot)} /> {WORK_STATUS_META[e.workStatus].label}
            </span>
            {e.supervisorId && <span>Reports to {employeeName(data, e.supervisorId)}</span>}
            {e.startedOn && <span>Since {formatShortYear(e.startedOn)}</span>}
            {e.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3.5" /> {e.phone}
              </span>
            )}
            <span>App role: {ROLE_LABEL[e.role]}</span>
          </div>
          {e.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {e.skills.map((s) => (
                <span key={s} className="rounded-md bg-steel-100 px-2 py-0.5 text-xs font-medium text-steel-700">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
        {e.id !== me && (
          <Button
            variant="outline"
            className="h-9 bg-white"
            onClick={() => {
              const t = actions.openDirectThread(e.id);
              if (t) router.push(`/dashboard/messages?thread=${t}`);
            }}
          >
            <MessageSquare className="size-4" /> Message {e.firstName}
          </Button>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          <Panel title={`Open assignments · ${open.length}`} bodyClassName="p-2">
            {open.length ? (
              <div className="divide-y divide-border/60">
                {open.map((w) => (
                  <WorkOrderRow key={w.id} data={data} wo={w} href={`/dashboard/work-orders/${w.id}`} />
                ))}
              </div>
            ) : (
              <EmptyState icon={Briefcase} title="No open assignments" className="border-0" />
            )}
          </Panel>
          <Panel title="Recent updates">
            {recent.length ? (
              <ActivityFeed data={data} items={recent} showWorkOrder compact workOrderHref={(wid) => `/dashboard/work-orders/${wid}`} />
            ) : (
              <p className="text-sm text-muted-foreground">No recent updates.</p>
            )}
          </Panel>
        </div>
        <div className="space-y-5">
          <Panel title="Summary" bodyClassName="grid grid-cols-2 gap-3">
            <Stat label="Open jobs" value={open.length} />
            <Stat label="Completed (all time)" value={done.length} />
            <Stat
              label="Latest briefing"
              value={latestBriefing && e.role !== "admin" ? (hasAcknowledged(data, latestBriefing.id, e.id) ? "Read" : "Not yet") : "—"}
            />
            <Stat label="Direct reports" value={reports.length} />
          </Panel>
          {reports.length > 0 && (
            <Panel title="Team members" bodyClassName="p-2">
              {reports.map((r) => (
                <Link key={r.id} href={`/dashboard/team/${r.id}`} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-steel-50">
                  <EmployeeAvatar employee={r} size="xs" showStatus />
                  <span className="flex-1 text-sm">{fullName(r)}</span>
                  <span className="text-xs text-muted-foreground">{r.position}</span>
                </Link>
              ))}
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-steel-50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="tabular font-display text-xl font-extrabold text-navy">{value}</p>
    </div>
  );
}
