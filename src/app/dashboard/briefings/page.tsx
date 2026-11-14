"use client";

import Link from "next/link";
import { FileText, Megaphone, Plus } from "lucide-react";
import { can } from "@/lib/auth/permissions";
import { formatDayTime, formatLongDay, todayKey } from "@/lib/dates";
import { useData } from "@/lib/store/app-store";
import { ackStats, employeeName } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ProgressBar } from "@/components/shared/progress-bar";

export default function BriefingsPage() {
  const data = useData();
  const canManage = can(data.session.role, "briefing.manage");
  const list = [...data.briefings].sort(
    (a, b) => (a.status === b.status ? b.date.localeCompare(a.date) : a.status === "draft" ? -1 : 1),
  );
  const hasToday = data.briefings.some((b) => b.status === "published" && b.date === todayKey());

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <PageHeader
        eyebrow="Morning communication"
        title="Daily briefings"
        description="One clear message to the shop every morning. Workers see it first when they open the app and tap “Got it” to confirm they've read it."
        actions={
          canManage && (
            <Button asChild variant="brand" className="h-9">
              <Link href="/dashboard/briefings/new">
                <Plus className="size-4" /> {hasToday ? "New briefing" : "Create today's briefing"}
              </Link>
            </Button>
          )
        }
      />
      {!canManage && (
        <p className="rounded-lg border bg-white p-3 text-sm text-muted-foreground">
          Supervisors can review briefings and who has read them. Publishing is done by the owner/admin in this demo.
        </p>
      )}
      {list.length === 0 ? (
        <EmptyState icon={Megaphone} title="No briefings yet" description="Create the first morning briefing for the shop." />
      ) : (
        <ul className="space-y-3">
          {list.map((b) => {
            const s = ackStats(data, b);
            const isToday = b.date === todayKey();
            return (
              <li key={b.id}>
                <Link
                  href={`/dashboard/briefings/${b.id}`}
                  className={cn(
                    "group flex flex-col gap-4 rounded-xl border bg-card p-4 transition hover:border-steel-300 hover:shadow-sm sm:flex-row sm:items-center",
                    isToday && b.status === "published" && "border-navy ring-1 ring-navy",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-14 shrink-0 flex-col items-center justify-center rounded-lg font-display",
                      b.status === "draft" ? "border border-dashed bg-steel-50 text-steel-500" : "bg-navy text-white",
                    )}
                  >
                    {b.status === "draft" ? (
                      <FileText className="size-5" />
                    ) : (
                      <>
                        <span className="text-[0.6rem] font-bold tracking-widest text-cyan uppercase">
                          {new Date(b.date + "T12:00").toLocaleDateString("en-US", { month: "short" })}
                        </span>
                        <span className="text-xl leading-none font-extrabold">{Number(b.date.slice(8))}</span>
                      </>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isToday && b.status === "published" && (
                        <span className="rounded bg-orange px-1.5 py-0.5 font-display text-[0.65rem] font-extrabold tracking-wider text-ink uppercase">Today</span>
                      )}
                      {b.status === "draft" && (
                        <span className="rounded bg-steel-200 px-1.5 py-0.5 font-display text-[0.65rem] font-extrabold tracking-wider text-steel-700 uppercase">Draft</span>
                      )}
                      <span className="text-xs text-muted-foreground">{formatLongDay(b.date)}</span>
                    </div>
                    <p className="mt-0.5 truncate font-display text-lg font-bold text-navy group-hover:underline">{b.title || "Untitled"}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {b.status === "published" ? `Published ${formatDayTime(b.publishedAt!)}` : `Last edited ${formatDayTime(b.updatedAt)}`} by{" "}
                      {employeeName(data, b.authorId)}
                    </p>
                  </div>
                  {b.status === "published" && (
                    <div className="w-full shrink-0 sm:w-48">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-muted-foreground">Acknowledged</span>
                        <span className="tabular font-mono font-semibold text-navy">
                          {s.acked.length}/{s.total}
                        </span>
                      </div>
                      <ProgressBar value={s.rate * 100} tone={s.rate === 1 ? "green" : "navy"} size="md" />
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
