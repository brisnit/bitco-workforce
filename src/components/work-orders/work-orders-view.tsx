"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowDownUp, ClipboardList, Plus, Search, X } from "lucide-react";
import { can } from "@/lib/auth/permissions";
import { ALL_STATUSES, PRIORITY_META, PRIORITY_ORDER, STATUS_META, WORK_TYPE_LABEL } from "@/lib/domain/constants";
import type { Priority, WorkOrder, WorkOrderStatus, WorkType } from "@/lib/domain/types";
import { formatDue } from "@/lib/dates";
import { useData } from "@/lib/store/app-store";
import {
  customerName,
  employeeById,
  fullName,
  isActive,
  isDueToday,
  isOverdue,
  openBlockersFor,
  sortByUrgency,
} from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { EmployeeAvatar } from "@/components/shared/employee-avatar";
import { PriorityBadge, ProblemFlag, StatusBadge } from "@/components/shared/badges";
import { ProgressBar } from "@/components/shared/progress-bar";
import { WorkOrderFormSheet } from "./work-order-form";

type View = "active" | "due" | "problems" | "all" | "closed";
const VIEWS: { id: View; label: string; test: (w: WorkOrder, d: ReturnType<typeof useData>) => boolean }[] = [
  { id: "active", label: "Active", test: (w) => isActive(w) },
  { id: "due", label: "Due today & overdue", test: (w) => isDueToday(w) || isOverdue(w) },
  { id: "problems", label: "Blocked / problems", test: (w, d) => w.status === "blocked" || openBlockersFor(d, w.id).length > 0 },
  { id: "closed", label: "Completed & cancelled", test: (w) => w.status === "completed" || w.status === "cancelled" },
  { id: "all", label: "All", test: () => true },
];
const ANY = "any";
type SortKey = "urgency" | "number" | "due" | "customer";

export function WorkOrdersView() {
  const data = useData();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [qLocal, setQLocal] = useState(params.get("q") ?? "");

  const view = (params.get("view") as View) ?? (params.get("status") ? "all" : "active");
  const q = qLocal;
  const status = (params.get("status") as WorkOrderStatus | null) ?? ANY;
  const priority = (params.get("priority") as Priority | null) ?? ANY;
  const type = (params.get("type") as WorkType | null) ?? ANY;
  const assignee = params.get("assignee") ?? ANY;
  const sort = (params.get("sort") as SortKey) ?? "urgency";

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === ANY) next.delete(key);
    else next.set(key, value);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const rows = useMemo(() => {
    const viewDef = VIEWS.find((v) => v.id === view) ?? VIEWS[0];
    const needle = q.trim().toLowerCase();
    const list = data.workOrders.filter((w) => {
      if (!viewDef.test(w, data)) return false;
      if (status !== ANY && w.status !== status) return false;
      if (priority !== ANY && w.priority !== priority) return false;
      if (type !== ANY && w.workType !== type) return false;
      if (assignee !== ANY && (assignee === "none" ? w.assigneeId !== null : w.assigneeId !== assignee)) return false;
      if (needle) {
        const hay = `${w.number} ${w.title} ${w.description} ${customerName(data, w.customerId)} ${
          employeeById(data, w.assigneeId) ? fullName(employeeById(data, w.assigneeId)!) : ""
        }`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    const sorters: Record<SortKey, (a: WorkOrder, b: WorkOrder) => number> = {
      urgency: sortByUrgency,
      number: (a, b) => b.number.localeCompare(a.number),
      due: (a, b) => a.dueDate.localeCompare(b.dueDate),
      customer: (a, b) => customerName(data, a.customerId).localeCompare(customerName(data, b.customerId)),
    };
    return list.sort(sorters[sort]);
  }, [data, view, q, status, priority, type, assignee, sort]);

  const filtersActive = status !== ANY || priority !== ANY || type !== ANY || assignee !== ANY || q;
  const workers = data.employees.filter((e) => e.role === "worker");

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-6">
      <PageHeader
        eyebrow="Shop jobs"
        title="Work orders"
        description="Every job from intake to completion. Click a row for full details and history."
        actions={
          can(data.session.role, "workOrder.create") && (
            <Button variant="brand" className="h-9" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> New work order
            </Button>
          )
        }
      />

      <div className="flex gap-1 overflow-x-auto border-b no-scrollbar">
        {VIEWS.map((v) => {
          const count = data.workOrders.filter((w) => v.test(w, data)).length;
          return (
            <button
              key={v.id}
              onClick={() => setParam("view", v.id)}
              className={cn(
                "relative flex shrink-0 items-center gap-2 px-3 pt-1 pb-2.5 text-sm font-medium whitespace-nowrap transition",
                view === v.id ? "text-navy" : "text-steel-500 hover:text-navy",
              )}
            >
              {v.label}
              <span className={cn("tabular rounded-full px-1.5 text-xs", view === v.id ? "bg-navy text-white" : "bg-steel-100")}>{count}</span>
              {view === v.id && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded bg-orange" />}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-steel-400" />
          <Input
            value={qLocal}
            onChange={(e) => {
              setQLocal(e.target.value);
              setParam("q", e.target.value);
            }}
            placeholder="Search number, job, customer, worker"
            className="h-9 bg-white pl-8"
            aria-label="Search work orders"
          />
        </div>
        <FilterSelect label="Status" value={status} onChange={(v) => setParam("status", v)} options={ALL_STATUSES.map((s) => [s, STATUS_META[s].label])} />
        <FilterSelect label="Priority" value={priority} onChange={(v) => setParam("priority", v)} options={PRIORITY_ORDER.map((p) => [p, PRIORITY_META[p].label])} />
        <FilterSelect label="Work type" value={type} onChange={(v) => setParam("type", v)} options={(Object.keys(WORK_TYPE_LABEL) as WorkType[]).map((t) => [t, WORK_TYPE_LABEL[t]])} />
        <FilterSelect
          label="Assignee"
          value={assignee}
          onChange={(v) => setParam("assignee", v)}
          options={[["none", "Unassigned"], ...workers.map((w) => [w.id, fullName(w)] as [string, string])]}
        />
        {filtersActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQLocal("");
              router.replace(`${pathname}?view=${view}`, { scroll: false });
            }}
          >
            <X className="size-3.5" /> Clear filters
          </Button>
        )}
        <div className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground">
          <ArrowDownUp className="size-3.5" />
          <Select value={sort} onValueChange={(v) => setParam("sort", v)}>
            <SelectTrigger size="sm" className="h-8 border-0 bg-transparent shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="urgency">Most urgent first</SelectItem>
              <SelectItem value="due">Due date</SelectItem>
              <SelectItem value="number">Newest</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No work orders match"
          description="Try a different view or clear the filters."
          action={
            filtersActive ? (
              <Button
                variant="outline"
                onClick={() => {
                  setQLocal("");
                  router.replace(`${pathname}?view=all`);
                }}
              >
                Show all work orders
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-steel-50 hover:bg-steel-50">
                <TableHead className="w-24 pl-4">WO #</TableHead>
                <TableHead>Job</TableHead>
                <TableHead className="hidden md:table-cell">Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Assigned</TableHead>
                <TableHead className="hidden xl:table-cell">Progress</TableHead>
                <TableHead className="hidden sm:table-cell">Due</TableHead>
                <TableHead className="hidden xl:table-cell text-right pr-4">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((w) => {
                const a = employeeById(data, w.assigneeId);
                const overdue = isOverdue(w);
                const problems = openBlockersFor(data, w.id).length;
                return (
                  <TableRow key={w.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/work-orders/${w.id}`)}>
                    <TableCell className="pl-4 font-mono text-xs font-semibold text-ocean">
                      <Link href={`/dashboard/work-orders/${w.id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">
                        {w.number}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[22rem]">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold text-navy">{w.title}</span>
                        <ProblemFlag count={problems} />
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {customerName(data, w.customerId)} · {WORK_TYPE_LABEL[w.workType]}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <PriorityBadge priority={w.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={w.status} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <EmployeeAvatar employee={a} size="xs" />
                        <span className={cn("text-sm", !a && "text-muted-foreground italic")}>{a ? fullName(a) : "Unassigned"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden w-32 xl:table-cell">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={w.progress} className="w-16" />
                        <span className="tabular text-xs text-muted-foreground">{w.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className={cn("hidden text-sm sm:table-cell", overdue && "font-semibold text-red-600")}>
                      {formatDue(w.dueDate)}
                      {overdue && <span className="ml-1 text-xs">· overdue</span>}
                    </TableCell>
                    <TableCell className="tabular hidden pr-4 text-right font-mono text-xs xl:table-cell">
                      {w.actualHours ?? "–"} / {w.estimatedHours}h
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="border-t bg-steel-50 px-4 py-2 text-xs text-muted-foreground">
            Showing {rows.length} of {data.workOrders.length} work orders · fictional demo data
          </div>
        </div>
      )}

      <WorkOrderFormSheet open={createOpen} onOpenChange={setCreateOpen} onSaved={(id) => router.push(`/dashboard/work-orders/${id}`)} />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className={cn("h-9 bg-white", value !== ANY && "border-navy text-navy")} aria-label={label}>
        <SelectValue placeholder={label}>{value === ANY ? label : options.find(([v]) => v === value)?.[1]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>Any {label.toLowerCase()}</SelectItem>
        {options.map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
