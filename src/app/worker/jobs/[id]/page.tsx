"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, CalendarClock, ClipboardList, MessageSquare, Play, SearchCheck, TrendingUp } from "lucide-react";
import { STATUS_META } from "@/lib/domain/constants";
import { formatDue } from "@/lib/dates";
import { actions, useData } from "@/lib/store/app-store";
import { activitiesFor, customerName, employeeById, fullName, isOverdue, openBlockersFor, workOrderById } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { EmployeeAvatar } from "@/components/shared/employee-avatar";
import { PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { ProgressBar } from "@/components/shared/progress-bar";
import { StatusStepper } from "@/components/work-orders/status-stepper";
import { ImageGallery } from "@/components/work-orders/image-gallery";
import { ActivityFeed } from "@/components/work-orders/activity-feed";
import { BlockerCard } from "@/components/work-orders/blocker-card";
import { ProgressSheet } from "@/components/worker/progress-sheet";
import { ProblemSheet } from "@/components/worker/problem-sheet";

export default function WorkerJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const data = useData();
  const router = useRouter();
  const wo = workOrderById(data, id);
  const [updating, setUpdating] = useState(false);
  const [problemOpen, setProblemOpen] = useState(false);
  if (!wo) return <div className="p-4"><EmptyState icon={ClipboardList} title="Job not found" /></div>;

  const me = data.session.employeeId;
  const mine = wo.assigneeId === me;
  const sup = employeeById(data, wo.supervisorId);
  const images = wo.attachmentIds.map((a) => data.attachments.find((x) => x.id === a)).filter((a) => !!a);
  const problems = openBlockersFor(data, wo.id);
  const overdue = isOverdue(wo);

  const start = () => actions.changeStatus(wo.id, "in_progress") && toast.success(`${wo.number} started`, { description: "Status: In Progress" });
  const toQc = () =>
    actions.changeStatus(wo.id, "quality_check") &&
    toast.success(`${wo.number} ready for Quality Check`, { description: "A supervisor will inspect and sign off." });

  return (
    <div className="pb-10">
      <div className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-white/95 px-2 backdrop-blur">
        <Button variant="ghost" className="h-11 text-base" onClick={() => router.back()}>
          <ArrowLeft className="size-5" /> Back
        </Button>
        <span className="ml-auto pr-3 font-mono text-base font-bold text-navy">{wo.number}</span>
      </div>

      <div className="space-y-5 p-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={wo.priority} size="lg" />
            <StatusBadge status={wo.status} size="lg" />
          </div>
          <h1 className="mt-2 font-display text-[1.7rem] leading-tight font-black text-ink">{wo.title}</h1>
          <p className="text-base text-steel-600">{customerName(data, wo.customerId)}</p>
          <p className={cn("mt-1 flex items-center gap-1.5 text-base font-semibold", overdue ? "text-red-600" : "text-steel-700")}>
            <CalendarClock className="size-5" /> Due {formatDue(wo.dueDate)}
            {overdue && " · overdue"}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <p className="eyebrow mb-3 text-steel-500">Production stage</p>
          <StatusStepper status={wo.status} resumeStatus={wo.resumeStatus} />
          {wo.status === "in_progress" && (
            <div className="mt-4 flex items-center gap-3">
              <ProgressBar value={wo.progress} size="lg" />
              <span className="tabular font-mono text-lg font-bold">{wo.progress}%</span>
            </div>
          )}
        </div>

        {mine && (
          <div className="space-y-3">
            {wo.status === "ready" && (
              <Button variant="brand" size="xl" className="h-16 w-full text-lg" onClick={start}>
                <Play className="fill-current" /> Start work
              </Button>
            )}
            {wo.status === "in_progress" && (
              <>
                <Button size="xl" className="h-16 w-full text-lg" onClick={() => setUpdating(true)}>
                  <TrendingUp /> Update progress
                </Button>
                <Button size="xl" variant="outline" className="h-auto min-h-16 w-full border-2 border-violet-300 bg-violet-50 py-3 text-lg leading-tight whitespace-normal text-violet-900" onClick={toQc}>
                  <SearchCheck /> Mark ready for quality check
                </Button>
              </>
            )}
            {(wo.status === "quality_check" || wo.status === "on_hold" || wo.status === "blocked") && (
              <p className={cn("rounded-xl p-4 text-base font-medium", wo.status === "blocked" ? "bg-red-50 text-red-800" : "bg-violet-50 text-violet-900")}>
                {wo.status === "blocked" ? "Work is stopped until your supervisor resolves the problem." : STATUS_META[wo.status].description}
              </p>
            )}
            <Button size="xl" variant="outline" className="h-16 w-full border-2 border-red-200 bg-white text-lg text-red-700" onClick={() => setProblemOpen(true)}>
              <AlertTriangle /> Report a problem
            </Button>
          </div>
        )}
        {!mine && <p className="rounded-xl bg-steel-100 p-4 text-base">This job isn&apos;t assigned to you, so you can view it but not update it.</p>}

        {problems.length > 0 && (
          <section className="space-y-2">
            <h2 className="eyebrow text-red-700">Open problems</h2>
            {problems.map((b) => (
              <BlockerCard key={b.id} data={data} blocker={b} showWorkOrder={false} />
            ))}
          </section>
        )}

        <section className="rounded-2xl border bg-white p-4">
          <h2 className="eyebrow mb-2 text-steel-500">Description</h2>
          <p className="text-base leading-relaxed text-ink">{wo.description}</p>
        </section>

        {wo.instructions.length > 0 && (
          <section className="rounded-2xl border bg-white p-4">
            <h2 className="eyebrow mb-3 text-steel-500">Instructions</h2>
            <ol className="space-y-3">
              {wo.instructions.map((s, i) => (
                <li key={i} className="flex gap-3 text-base">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange font-display font-black text-ink">{i + 1}</span>
                  <span className="pt-1">{s}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {images.length > 0 && (
          <section>
            <h2 className="eyebrow mb-2 text-steel-500">Reference images & photos</h2>
            <ImageGallery items={images} large />
          </section>
        )}

        {sup && (
          <section className="flex items-center gap-3 rounded-2xl border bg-white p-4">
            <EmployeeAvatar employee={sup} size="md" />
            <div className="flex-1">
              <p className="eyebrow text-steel-500">Supervisor</p>
              <p className="text-base font-semibold">{fullName(sup)}</p>
            </div>
            <Button
              variant="outline"
              className="h-12"
              onClick={() => {
                const t = actions.openWorkOrderThread(wo.id);
                if (t) router.push(`/worker/messages?thread=${t}`);
              }}
            >
              <MessageSquare className="size-5" /> Job chat
            </Button>
          </section>
        )}

        <section className="rounded-2xl border bg-white p-4">
          <h2 className="eyebrow mb-3 text-steel-500">Notes & activity</h2>
          <ActivityFeed data={data} items={activitiesFor(data, wo.id).slice(0, 12)} />
          <Link href="/worker/jobs" className="text-sm font-semibold text-ocean">All my jobs →</Link>
        </section>
      </div>
      <ProgressSheet
        wo={updating ? wo : null}
        onOpenChange={(o) => !o && setUpdating(false)}
        onReportProblem={() => {
          setUpdating(false);
          setProblemOpen(true);
        }}
      />
      <ProblemSheet open={problemOpen} workOrderId={wo.id} onOpenChange={setProblemOpen} />
    </div>
  );
}
