"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ClipboardCheck, Megaphone } from "lucide-react";
import type { WorkOrder } from "@/lib/domain/types";
import { formatLongDay, formatRelative, greeting } from "@/lib/dates";
import { useData } from "@/lib/store/app-store";
import { currentEmployee, employeeName, threadMessages, todaysBriefing, workOrdersForEmployee } from "@/lib/selectors";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { WorkerBriefingCard } from "@/components/worker/briefing-card";
import { WorkerJobCard } from "@/components/worker/job-card";
import { ProgressSheet } from "@/components/worker/progress-sheet";
import { ProblemSheet } from "@/components/worker/problem-sheet";

export default function WorkerTodayPage() {
  const data = useData();
  const me = currentEmployee(data);
  const [updating, setUpdating] = useState<WorkOrder | null>(null);
  const [problemOpen, setProblemOpen] = useState(false);
  const briefing = todaysBriefing(data, me);
  const ack = briefing && data.acknowledgements.find((a) => a.briefingId === briefing.id && a.employeeId === me.id);
  const jobs = workOrdersForEmployee(data, me.id).filter((w) => ["ready", "in_progress", "blocked", "quality_check", "on_hold"].includes(w.status));
  const announcements = threadMessages(data, "th-announce").slice(-2).reverse();

  return (
    <div className="pb-8">
      <section className="steel-texture bg-navy px-5 pt-6 pb-16 text-white">
        <p className="eyebrow text-cyan">{formatLongDay(new Date())}</p>
        <h1 className="mt-1 font-display text-[2rem] leading-none font-black tracking-tight uppercase">
          {greeting()},<br />
          <span className="text-orange">{me.firstName}.</span>
        </h1>
      </section>
      <div className="-mt-10 space-y-6 px-4">
        {briefing ? (
          <WorkerBriefingCard data={data} briefing={briefing} ackAt={ack?.acknowledgedAt} />
        ) : (
          <div className="rounded-2xl border bg-white p-5 text-center shadow">
            <Megaphone className="mx-auto size-8 text-steel-400" />
            <p className="mt-2 font-display font-bold text-navy">No briefing posted yet today</p>
            <p className="text-sm text-muted-foreground">Check back soon, or ask your supervisor.</p>
          </div>
        )}

        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-xl font-black tracking-tight text-navy uppercase">Your assignments</h2>
            <span className="text-sm font-semibold text-steel-500">{jobs.length} open</span>
          </div>
          {jobs.length ? (
            <div className="space-y-4">
              {jobs.map((w) => (
                <WorkerJobCard key={w.id} data={data} wo={w} onUpdate={setUpdating} />
              ))}
            </div>
          ) : (
            <EmptyState icon={ClipboardCheck} title="No open assignments" description="Your supervisor will assign your next job." />
          )}
        </section>

        <Button variant="outline" size="xl" className="w-full border-2 border-red-200 bg-white text-red-700" onClick={() => setProblemOpen(true)}>
          <AlertTriangle /> Report a problem
        </Button>

        {announcements.length > 0 && (
          <section>
            <h2 className="mb-3 font-display text-lg font-black tracking-tight text-navy uppercase">Shop announcements</h2>
            <div className="space-y-2">
              {announcements.map((m) => (
                <Link key={m.id} href="/worker/messages?thread=th-announce" className="block rounded-xl border bg-white p-4">
                  <p className="text-xs font-semibold text-steel-500">
                    {employeeName(data, m.senderId)} · {formatRelative(m.createdAt)}
                  </p>
                  <p className="mt-1 text-base text-ink">{m.body}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
      <ProgressSheet
        wo={updating}
        onOpenChange={(o) => !o && setUpdating(null)}
        onReportProblem={() => {
          setUpdating(null);
          setProblemOpen(true);
        }}
      />
      <ProblemSheet open={problemOpen} onOpenChange={setProblemOpen} workOrderId={updating?.id ?? null} />
    </div>
  );
}
