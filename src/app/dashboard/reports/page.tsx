"use client";

import Link from "next/link";
import { CalendarClock, CheckCheck, Clock, Gauge, Info } from "lucide-react";
import { can } from "@/lib/auth/permissions";
import { BLOCKER_CATEGORY_LABEL, STATUS_META } from "@/lib/domain/constants";
import { formatDue, formatShort } from "@/lib/dates";
import { useData } from "@/lib/store/app-store";
import {
  averageTurnaroundDays,
  blockerCategoryCounts,
  briefingAckRates,
  completedByWeek,
  countByStatus,
  customerName,
  employeeName,
  estimateAccuracy,
  isOverdue,
  sortByUrgency,
} from "@/lib/selectors";
import { PageHeader } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { DemoTag, PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { NoAccess } from "@/components/dashboard/no-access";
import { BarList, ColumnChart } from "@/components/reports/bar-charts";

export default function ReportsPage() {
  const data = useData();
  if (!can(data.session.role, "reports.view")) return <NoAccess what="view reports" />;

  const weeks = completedByWeek(data, 6);
  const byStatus = countByStatus(data);
  const blockers = blockerCategoryCounts(data);
  const overdue = data.workOrders.filter(isOverdue).sort(sortByUrgency);
  const turnaround = averageTurnaroundDays(data);
  const est = estimateAccuracy(data);
  const acks = briefingAckRates(data, 5);
  const avgAck = acks.length ? acks.reduce((s, a) => s + a.rate, 0) / acks.length : null;
  const totalCompleted = weeks.reduce((s, w) => s + w.count, 0);

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-6">
      <PageHeader
        eyebrow="Operations"
        title={<span className="flex items-center gap-3">Reports <DemoTag /></span>}
        description="Simple operating summaries calculated from the work orders, problem reports and briefings in this demo."
      />
      <div className="flex items-start gap-2 rounded-lg border border-dashed border-orange-700/40 bg-orange/5 p-3 text-sm text-steel-700">
        <Info className="mt-0.5 size-4 shrink-0 text-orange-700" />
        Every number here comes from fictional sample records. These are not BITCO results, and no financial or productivity
        claims are made.
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Completed · 6 weeks" value={totalCompleted} sub="Work orders closed after QC" icon={CheckCheck} />
        <KpiCard
          label="Avg. turnaround"
          value={turnaround ? `${turnaround.days.toFixed(1)}d` : "—"}
          sub={turnaround ? `Created → completed, ${turnaround.sample} jobs` : "Not enough completed jobs"}
          icon={Clock}
        />
        <KpiCard label="Overdue now" value={overdue.length} sub="Open jobs past target date" icon={CalendarClock} tone={overdue.length ? "alert" : "default"} />
        <KpiCard
          label="Hours vs. estimate"
          value={est.sample ? `${Math.round((est.actual / est.estimated) * 100)}%` : "—"}
          sub={est.sample ? `${est.actual}h actual / ${est.estimated}h est. (${est.sample} jobs)` : "No completed jobs with hours"}
          icon={Gauge}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Work orders completed by week">
          <ColumnChart
            valueLabel="completed"
            rows={weeks.map((w) => ({
              key: w.weekStart,
              label: w.isCurrent ? "This wk" : formatShort(w.weekStart),
              value: w.count,
              detail: `Week of ${formatShort(w.weekStart)}${w.isCurrent ? " (in progress)" : ""}`,
              highlight: w.isCurrent,
            }))}
          />
        </Panel>
        <Panel title="Active work orders by status">
          <BarList
            valueLabel="jobs"
            rows={byStatus.map((s) => ({
              key: s.status,
              label: STATUS_META[s.status].label,
              value: s.count,
              marker: <span className={`size-2 shrink-0 rounded-full ${STATUS_META[s.status].dot}`} />,
            }))}
          />
        </Panel>
        <Panel title="Common problem categories">
          {blockers.length ? (
            <BarList
              valueLabel="reports"
              rows={blockers.map((b) => ({
                key: b.category,
                label: BLOCKER_CATEGORY_LABEL[b.category],
                value: b.count,
                detail: `${b.count} problem report${b.count === 1 ? "" : "s"} (open + resolved)`,
              }))}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No problems reported.</p>
          )}
        </Panel>
        <Panel
          title="Briefing acknowledgement rate"
          action={avgAck !== null && <span className="tabular font-mono text-xs font-semibold text-navy">avg {Math.round(avgAck * 100)}%</span>}
        >
          <BarList
            valueLabel="% read"
            max={1}
            rows={acks.map((a) => ({
              key: a.briefing.id,
              label: `${formatDue(a.briefing.date)} · ${a.briefing.title}`,
              value: a.rate,
              display: `${Math.round(a.rate * 100)}%`,
              detail: `${a.acked.length} of ${a.total} acknowledged`,
            }))}
          />
        </Panel>
      </div>

      <Panel title={`Overdue jobs · ${overdue.length}`} bodyClassName="p-0">
        {overdue.length ? (
          <ul className="divide-y">
            {overdue.map((w) => (
              <li key={w.id}>
                <Link href={`/dashboard/work-orders/${w.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-steel-50">
                  <span className="font-mono text-xs font-bold text-ocean">{w.number}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-navy">{w.title}</span>
                  <span className="text-xs text-muted-foreground">{customerName(data, w.customerId)}</span>
                  <span className="text-xs text-muted-foreground">{employeeName(data, w.assigneeId)}</span>
                  <PriorityBadge priority={w.priority} />
                  <StatusBadge status={w.status} />
                  <span className="text-xs font-semibold text-red-600">Due {formatDue(w.dueDate)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-4 text-sm text-muted-foreground">Nothing overdue.</p>
        )}
      </Panel>
    </div>
  );
}
