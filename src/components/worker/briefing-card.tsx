"use client";

import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, ChevronRight, Megaphone } from "lucide-react";
import type { AppData, Briefing } from "@/lib/domain/types";
import { formatLongDay, formatTime } from "@/lib/dates";
import { actions } from "@/lib/store/app-store";
import { employeeName } from "@/lib/selectors";
import { Button } from "@/components/ui/button";
import { BriefingContent } from "@/components/briefings/briefing-content";

/** The first thing a worker sees: today's briefing + "Got it". */
export function WorkerBriefingCard({ data, briefing, ackAt, full = false }: { data: AppData; briefing: Briefing; ackAt?: string; full?: boolean }) {
  if (ackAt && !full) {
    return (
      <Link href="/worker/briefing" className="flex items-center gap-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4">
        <CheckCircle2 className="size-8 shrink-0 text-emerald-600" />
        <div className="min-w-0 flex-1">
          <p className="font-display font-extrabold text-emerald-900 uppercase">Briefing read</p>
          <p className="truncate text-sm text-emerald-800">
            {briefing.title} · {formatTime(ackAt)}
          </p>
        </div>
        <ChevronRight className="size-6 text-emerald-700" />
      </Link>
    );
  }
  return (
    <article className="overflow-hidden rounded-2xl border-2 border-navy bg-white shadow-lg">
      <header className="steel-texture bg-navy px-5 pt-4 pb-5 text-white">
        <p className="eyebrow flex items-center gap-1.5 text-orange">
          <Megaphone className="size-3.5" /> Today&apos;s shop briefing
        </p>
        <p className="mt-0.5 text-sm text-white/70">
          {formatLongDay(briefing.date)} · from {employeeName(data, briefing.authorId)}
        </p>
        <h2 className="mt-2 font-display text-2xl leading-tight font-extrabold">{briefing.title}</h2>
      </header>
      <div className="p-5">
        <BriefingContent data={data} briefing={briefing} size="lg" jobHref={(id) => `/worker/jobs/${id}`} />
      </div>
      <div className="border-t bg-steel-50 p-4">
        {ackAt ? (
          <p className="flex items-center justify-center gap-2 py-2 text-base font-semibold text-emerald-700">
            <CheckCircle2 className="size-6" /> You confirmed you read this at {formatTime(ackAt)}
          </p>
        ) : (
          <>
            <Button
              variant="brand"
              size="xl"
              className="h-16 w-full text-lg"
              onClick={() => {
                if (actions.acknowledgeBriefing(briefing.id)) {
                  toast.success("Thanks — briefing acknowledged", { description: "The office can see you've read it." });
                }
              }}
            >
              <CheckCircle2 className="size-6" /> Got it — I&apos;ve read this
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">This is a read receipt only — not a safety or training sign-off.</p>
          </>
        )}
      </div>
    </article>
  );
}
