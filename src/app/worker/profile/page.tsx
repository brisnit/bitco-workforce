"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, Info, Smartphone } from "lucide-react";
import { WORK_STATUS_META } from "@/lib/domain/constants";
import type { WorkStatus } from "@/lib/domain/types";
import { formatLongDay, formatShortYear } from "@/lib/dates";
import { actions, useData } from "@/lib/store/app-store";
import { currentEmployee, employeeName, fullName, hasAcknowledged, isBriefingRecipient, publishedBriefings, teamName, workOrdersForEmployee } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmployeeAvatar } from "@/components/shared/employee-avatar";
import { AboutDemoDialog } from "@/components/shared/about-demo-dialog";

export default function WorkerProfilePage() {
  const data = useData();
  const me = currentEmployee(data);
  const [about, setAbout] = useState(false);
  const briefings = publishedBriefings(data).filter((b) => isBriefingRecipient(b, me)).slice(0, 5);
  const done = workOrdersForEmployee(data, me.id).filter((w) => w.status === "completed").length;

  return (
    <div className="space-y-5 p-4 pb-10">
      <div className="flex items-center gap-4 rounded-2xl bg-navy p-5 text-white steel-texture">
        <EmployeeAvatar employee={me} size="xl" />
        <div>
          <h1 className="font-display text-2xl font-black">{fullName(me)}</h1>
          <p className="text-white/80">{me.position}</p>
          <p className="text-sm text-white/60">
            {teamName(data, me.teamId)} · Supervisor: {employeeName(data, me.supervisorId, "—")}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border bg-white p-4">
        <h2 className="eyebrow mb-1 text-steel-500">My availability</h2>
        <p className="mb-3 text-sm text-muted-foreground">Self-reported so your supervisor knows who&apos;s free. No location tracking.</p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(WORK_STATUS_META) as WorkStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => actions.updateEmployee(me.id, { workStatus: s }) && toast.success(`Status: ${WORK_STATUS_META[s].label}`)}
              className={cn("flex h-14 flex-col items-center justify-center gap-1 rounded-xl border-2 text-sm font-bold", me.workStatus === s ? "border-navy bg-navy text-white" : "border-steel-200")}
            >
              <span className={cn("size-2.5 rounded-full", WORK_STATUS_META[s].dot)} />
              {WORK_STATUS_META[s].label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-muted-foreground">Jobs completed</p>
          <p className="font-display text-3xl font-black text-navy">{done}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-muted-foreground">With BITCO since</p>
          <p className="font-display text-lg font-black text-navy">{me.startedOn ? formatShortYear(me.startedOn) : "—"}</p>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4">
        <h2 className="eyebrow mb-3 text-steel-500">Recent briefings</h2>
        <ul className="divide-y">
          {briefings.map((b) => {
            const read = hasAcknowledged(data, b.id, me.id);
            return (
              <li key={b.id} className="flex items-center gap-3 py-2.5">
                {read ? <CheckCircle2 className="size-5 shrink-0 text-emerald-600" /> : <Clock className="size-5 shrink-0 text-amber-600" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{b.title}</p>
                  <p className="text-xs text-muted-foreground">{formatLongDay(b.date)}</p>
                </div>
                <span className={cn("text-xs font-bold uppercase", read ? "text-emerald-700" : "text-amber-700")}>{read ? "Read" : "Not yet"}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex gap-3 rounded-2xl border bg-white p-4">
        <Smartphone className="size-6 shrink-0 text-ocean" />
        <p className="text-sm text-steel-700">
          <strong>Add to Home Screen:</strong> in your phone&apos;s browser menu, choose &ldquo;Add to Home Screen&rdquo; to open BITCO Workforce like
          an app. This is a web app, not a native app from the app store.
        </p>
      </section>

      <Button variant="outline" size="xl" className="w-full" onClick={() => setAbout(true)}>
        <Info /> About this prototype
      </Button>
      <AboutDemoDialog open={about} onOpenChange={setAbout} />
    </div>
  );
}
