"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Search, ShieldCheck, UserPlus } from "lucide-react";
import { can } from "@/lib/auth/permissions";
import { ROLE_LABEL, WORK_STATUS_META } from "@/lib/domain/constants";
import type { Position, Role } from "@/lib/domain/types";
import { actions, useData } from "@/lib/store/app-store";
import { employeeName, fullName, teamName, workOrdersForEmployee } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmployeeAvatar } from "@/components/shared/employee-avatar";
import { StatusBadge } from "@/components/shared/badges";

const POSITIONS: Position[] = ["Shop Supervisor", "Machinist", "CNC Operator", "Repair Technician", "Fabricator", "Quality Inspector"];

export default function TeamPage() {
  const data = useData();
  const [team, setTeam] = useState<string>("all");
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const people = data.employees
    .filter((e) => e.active)
    .filter((e) => team === "all" || e.teamId === team || (team === "office" && !e.teamId))
    .filter((e) => `${fullName(e)} ${e.position}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-6">
      <PageHeader
        eyebrow="People"
        title="Team"
        description="Who's on which team and what they're assigned to."
        actions={
          can(data.session.role, "team.manage") && (
            <Button variant="brand" className="h-9" onClick={() => setAddOpen(true)}>
              <UserPlus className="size-4" /> Add employee
            </Button>
          )
        }
      />
      <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm text-emerald-900">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        <p>
          Built for visibility into assignments and communication — not surveillance. No location tracking, activity monitoring or
          automated performance scoring. Work status is self-reported availability.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-steel-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people" className="h-9 bg-white pl-8" aria-label="Search people" />
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border bg-white p-0.5">
          {[{ id: "all", name: "Everyone" }, ...data.teams, { id: "office", name: "Office" }].map((t) => (
            <button
              key={t.id}
              onClick={() => setTeam(t.id)}
              className={cn("rounded-md px-3 py-1.5 text-sm font-medium", team === t.id ? "bg-navy text-white" : "text-steel-600 hover:text-navy")}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {people.map((e) => {
          const jobs = workOrdersForEmployee(data, e.id).filter((w) => !["completed", "cancelled"].includes(w.status));
          const current = jobs.find((j) => j.status === "in_progress") ?? jobs[0];
          return (
            <Link key={e.id} href={`/dashboard/team/${e.id}`} className="group rounded-xl border bg-card p-4 transition hover:border-steel-300 hover:shadow-sm">
              <div className="flex items-start gap-3">
                <EmployeeAvatar employee={e} size="lg" showStatus />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base font-bold text-navy group-hover:underline">{fullName(e)}</p>
                  <p className="text-sm text-steel-600">{e.position}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.teamId ? teamName(data, e.teamId) : "Office"}
                    {e.supervisorId && ` · reports to ${employeeName(data, e.supervisorId).split(" ")[0]}`}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-steel-50 px-2 py-0.5 text-xs text-steel-700 ring-1 ring-border">
                  <span className={cn("size-1.5 rounded-full", WORK_STATUS_META[e.workStatus].dot)} />
                  {WORK_STATUS_META[e.workStatus].label}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t pt-3 text-sm">
                {current ? (
                  <>
                    <span className="font-mono text-xs font-bold text-ocean">{current.number}</span>
                    <span className="min-w-0 flex-1 truncate text-steel-700">{current.title}</span>
                    <StatusBadge status={current.status} />
                  </>
                ) : (
                  <span className="text-muted-foreground">{e.role === "worker" ? "No open assignments" : ROLE_LABEL[e.role as Role]}</span>
                )}
              </div>
              {jobs.length > 1 && <p className="mt-1 text-xs text-muted-foreground">+{jobs.length - 1} more open job{jobs.length > 2 ? "s" : ""}</p>}
            </Link>
          );
        })}
      </div>
      <AddEmployeeDialog open={addOpen} onOpenChange={setAddOpen} positions={POSITIONS} />
    </div>
  );
}

function AddEmployeeDialog({ open, onOpenChange, positions }: { open: boolean; onOpenChange: (o: boolean) => void; positions: Position[] }) {
  const data = useData();
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [position, setPosition] = useState<Position>("Machinist");
  const [teamId, setTeamId] = useState(data.teams[0].id);

  function save() {
    const supervisorId = data.teams.find((t) => t.id === teamId)?.supervisorId ?? null;
    const id = actions.addEmployee({
      firstName,
      lastName,
      position,
      teamId,
      supervisorId: position === "Shop Supervisor" ? "emp-eran" : supervisorId,
      role: position === "Shop Supervisor" ? "supervisor" : "worker",
      phone: undefined,
      skills: [],
    });
    if (id) {
      toast.success(`${firstName} added to the team`, { description: "Demo only — no account or invite is created." });
      setFirst("");
      setLast("");
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add employee</DialogTitle>
          <DialogDescription>Adds a fictional person to the demo directory. No login is created.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="fn">First name</Label>
            <Input id="fn" value={firstName} onChange={(e) => setFirst(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ln">Last name</Label>
            <Input id="ln" value={lastName} onChange={(e) => setLast(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Position</Label>
            <Select value={position} onValueChange={(v) => setPosition(v as Position)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {positions.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Team</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!firstName.trim()}>
            Add employee
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
