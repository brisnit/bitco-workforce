"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Megaphone, Pencil, Users } from "lucide-react";
import { can } from "@/lib/auth/permissions";
import { formatDayTime, formatLongDay, formatTime } from "@/lib/dates";
import { useData } from "@/lib/store/app-store";
import { ackStats, employeeName, fullName, teamName } from "@/lib/selectors";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/shared/panel";
import { EmptyState } from "@/components/shared/empty-state";
import { EmployeeAvatar } from "@/components/shared/employee-avatar";
import { ProgressBar } from "@/components/shared/progress-bar";
import { BriefingContent } from "@/components/briefings/briefing-content";
import { DeleteBriefingButton } from "@/components/briefings/briefing-editor";

export default function BriefingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const data = useData();
  const router = useRouter();
  const b = data.briefings.find((x) => x.id === id);
  if (!b) {
    return (
      <div className="p-6">
        <EmptyState icon={Megaphone} title="Briefing not found" action={<Button asChild variant="outline"><Link href="/dashboard/briefings">Back to briefings</Link></Button>} />
      </div>
    );
  }
  const s = ackStats(data, b);
  const canManage = can(data.session.role, "briefing.manage");
  const audienceLabel =
    b.audience.type === "all"
      ? "Entire shop"
      : b.audience.type === "team"
        ? b.audience.teamIds.map((t) => teamName(data, t)).join(", ")
        : `${b.audience.employeeIds.length} selected employees`;

  return (
    <div className="mx-auto max-w-[1280px] space-y-5 p-4 sm:p-6">
      <Link href="/dashboard/briefings" className="inline-flex items-center gap-1.5 text-sm font-medium text-steel-600 hover:text-navy">
        <ArrowLeft className="size-4" /> Daily briefings
      </Link>

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <article className="overflow-hidden rounded-xl border bg-card">
          <header className="steel-texture bg-navy px-6 py-6 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow text-cyan">{formatLongDay(b.date)}</span>
              {b.status === "draft" && (
                <span className="rounded bg-white/15 px-1.5 py-0.5 font-display text-[0.65rem] font-extrabold tracking-wider uppercase">Draft — not visible to workers</span>
              )}
            </div>
            <h1 className="mt-2 font-display text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">{b.title}</h1>
            <p className="mt-2 text-sm text-white/70">
              {b.status === "published" ? `Published ${formatDayTime(b.publishedAt!)}` : `Draft saved ${formatDayTime(b.updatedAt)}`} by{" "}
              {employeeName(data, b.authorId)} · Audience: {audienceLabel}
            </p>
            {canManage && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="brand" className="h-9">
                  <Link href={`/dashboard/briefings/${b.id}/edit`}>
                    <Pencil className="size-4" /> {b.status === "draft" ? "Edit & publish" : "Edit"}
                  </Link>
                </Button>
                <div className="rounded-md bg-white">
                  <DeleteBriefingButton id={b.id} onDeleted={() => router.push("/dashboard/briefings")} />
                </div>
              </div>
            )}
          </header>
          <div className="p-6">
            <BriefingContent data={data} briefing={b} size="lg" jobHref={(wid) => `/dashboard/work-orders/${wid}`} />
          </div>
        </article>

        <aside className="space-y-5">
          <Panel
            title={
              <h2 className="eyebrow flex items-center gap-1.5 text-steel-600">
                <Users className="size-3.5" /> Acknowledgements
              </h2>
            }
          >
            {b.status === "draft" ? (
              <p className="text-sm text-muted-foreground">Acknowledgements start once the briefing is published. {s.total} people will receive it.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="tabular font-display text-3xl font-extrabold text-navy">
                      {s.acked.length}
                      <span className="text-lg text-steel-400">/{s.total}</span>
                    </span>
                    <span className="tabular font-mono text-sm font-semibold">{Math.round(s.rate * 100)}%</span>
                  </div>
                  <ProgressBar value={s.rate * 100} size="md" tone={s.rate === 1 ? "green" : "navy"} className="mt-2" />
                </div>
                <div>
                  <p className="eyebrow mb-2 text-emerald-700">Read & acknowledged</p>
                  {s.acked.length ? (
                    <ul className="space-y-1.5">
                      {s.acked.map(({ employee, at }) => (
                        <li key={employee.id} className="flex items-center gap-2.5 text-sm">
                          <EmployeeAvatar employee={employee} size="xs" />
                          <span className="flex-1 truncate">{fullName(employee)}</span>
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                            <CheckCircle2 className="size-3.5" /> {formatTime(at)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No one yet.</p>
                  )}
                </div>
                <div>
                  <p className="eyebrow mb-2 text-amber-700">Not yet</p>
                  {s.pending.length ? (
                    <ul className="space-y-1.5">
                      {s.pending.map((e) => (
                        <li key={e.id} className="flex items-center gap-2.5 text-sm text-steel-600">
                          <EmployeeAvatar employee={e} size="xs" className="opacity-60" />
                          <span className="flex-1 truncate">{fullName(e)}</span>
                          <span className="inline-flex items-center gap-1 text-xs">
                            <Clock className="size-3.5" /> {e.workStatus === "off_today" ? "Off today" : "Pending"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-emerald-700">Everyone has read it.</p>
                  )}
                </div>
                <p className="border-t pt-3 text-xs text-muted-foreground">
                  An acknowledgement means the worker tapped &ldquo;Got it&rdquo;. It is a read receipt, not a legal, training or
                  safety certification.
                </p>
              </div>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
