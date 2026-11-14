"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCheck,
  ClipboardList,
  HardHat,
  Megaphone,
  OctagonAlert,
  Plus,
} from "lucide-react";
import { can } from "@/lib/auth/permissions";
import { WORK_STATUS_META } from "@/lib/domain/constants";
import type { Blocker } from "@/lib/domain/types";
import { formatDue, formatLongDay, greeting, todayKey } from "@/lib/dates";
import { useData } from "@/lib/store/app-store";
import {
  ackStats,
  currentEmployee,
  dashboardKpis,
  fullName,
  isActive,
  isOverdue,
  openBlockers,
  shopActivity,
  sortByUrgency,
  workOrdersForEmployee,
} from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/shared/panel";
import { EmptyState } from "@/components/shared/empty-state";
import { EmployeeAvatar } from "@/components/shared/employee-avatar";
import { ProgressBar } from "@/components/shared/progress-bar";
import { PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { WorkOrderRow } from "@/components/work-orders/work-order-row";
import { BlockerCard } from "@/components/work-orders/blocker-card";
import { ResolveBlockerDialog } from "@/components/work-orders/resolve-blocker-dialog";
import { ActivityFeed } from "@/components/work-orders/activity-feed";

export default function OverviewPage() {
  const data = useData();
  const me = currentEmployee(data);
  const role = data.session.role;
  const k = dashboardKpis(data);
  const [resolving, setResolving] = useState<Blocker | null>(null);
  const [scope, setScope] = useState<"mine" | "all">(role === "supervisor" ? "mine" : "all");

  const inScope = (supervisorId: string | null) => scope === "all" || supervisorId === me.id;
  const production = data.workOrders
    .filter((w) => ["ready", "in_progress", "quality_check", "blocked"].includes(w.status) && inScope(w.supervisorId))
    .sort(sortByUrgency)
    .slice(0, 8);
  const blockers = openBlockers(data);
  const overdue = data.workOrders.filter(isOverdue).sort(sortByUrgency);
  const unassignedUrgent = data.workOrders.filter(
    (w) => isActive(w) && !w.assigneeId && (w.priority === "rush" || w.priority === "high"),
  );
  const attentionCount = blockers.length + overdue.length + unassignedUrgent.length;
  const workers = data.employees
    .filter((e) => e.role === "worker" && e.active)
    .filter((e) => scope === "all" || e.supervisorId === me.id || data.teams.find((t) => t.id === e.teamId)?.supervisorId === me.id);
  const todayBriefingExists = k.briefing?.date === todayKey();

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="eyebrow text-orange-700">{formatLongDay(new Date())} · Main Machine Shop</div>
          <h1 className="mt-1 font-display text-[1.75rem] font-extrabold tracking-[-0.02em] text-navy">
            {greeting()}, {me.firstName}.
          </h1>
          <p className="text-sm text-muted-foreground">
            {k.active} active jobs · {k.dueToday} due today · {attentionCount} item{attentionCount === 1 ? "" : "s"} need attention
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {role === "supervisor" && (
            <div className="flex rounded-lg border bg-white p-0.5 text-sm">
              {(["mine", "all"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  className={cn("rounded-md px-3 py-1.5 font-medium", scope === s ? "bg-navy text-white" : "text-steel-600")}
                >
                  {s === "mine" ? "My teams" : "Whole shop"}
                </button>
              ))}
            </div>
          )}
          {can(role, "briefing.manage") &&
            (todayBriefingExists ? (
              <Button asChild variant="outline" className="h-9 bg-white">
                <Link href={`/dashboard/briefings/${k.briefing!.id}`}>
                  <Megaphone className="size-4" /> Today&apos;s briefing
                </Link>
              </Button>
            ) : (
              <Button asChild variant="brand" className="h-9">
                <Link href="/dashboard/briefings/new">
                  <Plus className="size-4" /> Create today&apos;s briefing
                </Link>
              </Button>
            ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Active work orders" value={k.active} sub="New through Quality Check, incl. held" icon={ClipboardList} href="/dashboard/work-orders?view=active" />
        <KpiCard label="Due today" value={k.dueToday} sub={k.overdue ? `${k.overdue} overdue` : "None overdue"} icon={CalendarClock} href="/dashboard/work-orders?view=due" />
        <KpiCard label="Completed this week" value={k.completedThisWeek} sub="Since Monday" icon={CheckCheck} href="/dashboard/work-orders?status=completed" />
        <KpiCard
          label="Jobs blocked"
          value={k.blockedJobs}
          sub={`${k.openBlockers} open problem report${k.openBlockers === 1 ? "" : "s"}`}
          icon={OctagonAlert}
          tone={k.blockedJobs ? "alert" : "default"}
          href="/dashboard/work-orders?view=problems"
        />
        <KpiCard label="Workers assigned" value={`${k.workersAssigned}/${k.shopWorkers}`} sub="With an open job on the floor" icon={HardHat} href="/dashboard/team" />
        <KpiCard
          label="Briefing read"
          value={k.ack ? `${k.ack.acked.length}/${k.ack.total}` : "—"}
          sub={k.briefing ? (todayBriefingExists ? "Today's briefing" : `Latest: ${formatDue(k.briefing.date)}`) : "No briefing yet"}
          icon={Megaphone}
          tone="brand"
          href={k.briefing ? `/dashboard/briefings/${k.briefing.id}` : "/dashboard/briefings/new"}
        >
          {k.ack && <ProgressBar value={k.ack.rate * 100} className="mt-2 bg-white/15" />}
        </KpiCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Today's production */}
        <Panel
          className="xl:col-span-2"
          title="Today's production"
          action={
            <Link href="/dashboard/production" className="text-xs font-semibold text-ocean hover:underline">
              Production board →
            </Link>
          }
          bodyClassName="p-2"
        >
          {production.length ? (
            <div className="divide-y divide-border/60">
              {production.map((w) => (
                <WorkOrderRow key={w.id} data={data} wo={w} href={`/dashboard/work-orders/${w.id}`} />
              ))}
            </div>
          ) : (
            <EmptyState icon={ClipboardList} title="Nothing on the floor" description="No jobs are ready, in progress or in QC." />
          )}
        </Panel>

        {/* Needs attention */}
        <Panel
          id="needs-attention"
          title={
            <h2 className="eyebrow flex items-center gap-2 text-red-700">
              <AlertTriangle className="size-3.5" /> Needs attention
              {attentionCount > 0 && (
                <span className="tabular rounded-full bg-red-600 px-1.5 py-px text-[0.65rem] text-white">{attentionCount}</span>
              )}
            </h2>
          }
          className={cn(attentionCount > 0 && "border-red-200")}
          bodyClassName="space-y-4 max-h-[34rem] overflow-y-auto"
        >
          {attentionCount === 0 && <EmptyState icon={CheckCheck} title="All clear" description="No open problems, overdue or unassigned urgent jobs." />}
          {blockers.length > 0 && (
            <div className="space-y-2">
              <p className="eyebrow text-steel-500">Reported problems · {blockers.length}</p>
              {blockers.map((b) => (
                <BlockerCard key={b.id} data={data} blocker={b} onResolve={can(role, "blocker.resolve") ? setResolving : undefined} />
              ))}
            </div>
          )}
          {overdue.length > 0 && (
            <div className="space-y-2">
              <p className="eyebrow text-steel-500">Overdue · {overdue.length}</p>
              {overdue.map((w) => (
                <Link key={w.id} href={`/dashboard/work-orders/${w.id}`} className="flex items-center gap-2 rounded-lg border border-red-200 bg-white p-2.5 hover:bg-red-50/50">
                  <span className="font-mono text-xs font-semibold text-ocean">{w.number}</span>
                  <span className="flex-1 truncate text-sm font-medium">{w.title}</span>
                  <span className="text-xs font-semibold text-red-600">Due {formatDue(w.dueDate)}</span>
                </Link>
              ))}
            </div>
          )}
          {unassignedUrgent.length > 0 && (
            <div className="space-y-2">
              <p className="eyebrow text-steel-500">Urgent & unassigned · {unassignedUrgent.length}</p>
              {unassignedUrgent.map((w) => (
                <Link key={w.id} href={`/dashboard/work-orders/${w.id}`} className="flex items-center gap-2 rounded-lg border bg-white p-2.5 hover:bg-steel-50">
                  <PriorityBadge priority={w.priority} />
                  <span className="font-mono text-xs font-semibold text-ocean">{w.number}</span>
                  <span className="flex-1 truncate text-sm">{w.title}</span>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Daily briefing */}
        <Panel
          title="Daily briefing"
          action={
            k.briefing && (
              <Link href={`/dashboard/briefings/${k.briefing.id}`} className="text-xs font-semibold text-ocean hover:underline">
                Details →
              </Link>
            )
          }
        >
          {k.briefing && k.ack ? (
            <BriefingSummary briefingId={k.briefing.id} />
          ) : (
            <EmptyState
              icon={Megaphone}
              title="No briefing published"
              action={
                can(role, "briefing.manage") && (
                  <Button asChild variant="brand">
                    <Link href="/dashboard/briefings/new">Create today&apos;s briefing</Link>
                  </Button>
                )
              }
            />
          )}
        </Panel>

        {/* Team status */}
        <Panel
          title="Team status"
          action={
            <Link href="/dashboard/team" className="text-xs font-semibold text-ocean hover:underline">
              Team →
            </Link>
          }
          bodyClassName="p-2"
        >
          <ul className="divide-y divide-border/60">
            {workers.map((e) => {
              const jobs = workOrdersForEmployee(data, e.id);
              const current = jobs.find((j) => j.status === "in_progress") ?? jobs.find((j) => ["ready", "blocked", "quality_check"].includes(j.status));
              return (
                <li key={e.id}>
                  <Link href={`/dashboard/team/${e.id}`} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-steel-50">
                    <EmployeeAvatar employee={e} size="sm" showStatus />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy">
                        {fullName(e)} <span className="font-normal text-muted-foreground">· {e.position}</span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {e.workStatus === "off_today"
                          ? WORK_STATUS_META.off_today.label
                          : current
                            ? `${current.number} · ${current.title}`
                            : e.position === "Quality Inspector"
                              ? `QC queue: ${data.workOrders.filter((w) => w.status === "quality_check").length}`
                              : "No open assignment"}
                      </p>
                    </div>
                    {current && e.workStatus !== "off_today" && <StatusBadge status={current.status} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>

        {/* Shop activity */}
        <Panel title="Shop activity" className="lg:col-span-2 xl:col-span-1" bodyClassName="max-h-[30rem] overflow-y-auto">
          <ActivityFeed data={data} items={shopActivity(data, 14)} showWorkOrder compact workOrderHref={(id) => `/dashboard/work-orders/${id}`} />
        </Panel>
      </div>

      <p className="pb-2 text-center text-xs text-muted-foreground">
        All figures are calculated from fictional demonstration records stored in this browser.
      </p>
      <ResolveBlockerDialog blocker={resolving} onOpenChange={(o) => !o && setResolving(null)} />
    </div>
  );
}

function BriefingSummary({ briefingId }: { briefingId: string }) {
  const data = useData();
  const b = data.briefings.find((x) => x.id === briefingId)!;
  const s = ackStats(data, b);
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground">{formatLongDay(b.date)}</p>
        <p className="font-display text-lg leading-snug font-bold text-navy">{b.title}</p>
        <p className="mt-1 line-clamp-2 text-sm text-steel-600">{b.message}</p>
      </div>
      <div>
        <div className="mb-1.5 flex items-baseline justify-between text-sm">
          <span className="font-semibold text-navy">Acknowledged</span>
          <span className="tabular font-mono text-xs">
            {s.acked.length} of {s.total} · {Math.round(s.rate * 100)}%
          </span>
        </div>
        <ProgressBar value={s.rate * 100} size="md" tone="navy" />
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="eyebrow mb-1.5 text-emerald-700">Read ({s.acked.length})</p>
          <div className="flex flex-wrap gap-1">
            {s.acked.map(({ employee }) => (
              <EmployeeAvatar key={employee.id} employee={employee} size="xs" />
            ))}
          </div>
        </div>
        <div>
          <p className="eyebrow mb-1.5 text-amber-700">Not yet ({s.pending.length})</p>
          <div className="flex flex-wrap gap-1">
            {s.pending.map((e) => (
              <span key={e.id} title={fullName(e)}>
                <EmployeeAvatar employee={e} size="xs" className="opacity-60" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
