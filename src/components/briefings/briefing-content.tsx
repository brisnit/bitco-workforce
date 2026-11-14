import Link from "next/link";
import { Bell, ClipboardList, HardHat, ListOrdered, Wrench } from "lucide-react";
import type { AppData, Briefing } from "@/lib/domain/types";
import { workOrderById } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { PriorityBadge, StatusBadge } from "@/components/shared/badges";

type Draft = Pick<
  Briefing,
  "title" | "message" | "priorities" | "safetyReminders" | "equipmentUpdates" | "announcements" | "specialAttentionWorkOrderIds"
>;

/** Renders briefing sections. Shared by the editor preview, admin view and worker app. */
export function BriefingContent({
  data,
  briefing,
  size = "md",
  jobHref,
}: {
  data: AppData;
  briefing: Draft;
  size?: "md" | "lg";
  jobHref?: (id: string) => string;
}) {
  const lg = size === "lg";
  const jobs = briefing.specialAttentionWorkOrderIds.map((id) => workOrderById(data, id)).filter((w) => !!w);
  const clean = (xs: string[]) => xs.map((s) => s.trim()).filter(Boolean);
  return (
    <div className={cn("space-y-5", lg && "space-y-6")}>
      {briefing.message.trim() && (
        <p className={cn("leading-relaxed whitespace-pre-line text-ink", lg ? "text-[1.075rem]" : "text-[0.95rem]")}>{briefing.message}</p>
      )}
      <Section icon={ListOrdered} title="Today's priorities" items={clean(briefing.priorities)} ordered lg={lg} tone="navy" />
      <Section icon={HardHat} title="Safety reminders" items={clean(briefing.safetyReminders)} lg={lg} tone="safety" />
      <Section icon={Wrench} title="Equipment updates" items={clean(briefing.equipmentUpdates)} lg={lg} tone="plain" />
      <Section icon={Bell} title="Shop announcements" items={clean(briefing.announcements)} lg={lg} tone="plain" />
      {jobs.length > 0 && (
        <div>
          <SectionHeading icon={ClipboardList} title="Jobs needing special attention" lg={lg} />
          <ul className="space-y-2">
            {jobs.map((w) => {
              const inner = (
                <>
                  <span className="font-mono text-sm font-bold text-ocean">{w.number}</span>
                  <span className={cn("min-w-0 flex-1 truncate font-semibold text-navy", lg ? "text-base" : "text-sm")}>{w.title}</span>
                  <PriorityBadge priority={w.priority} />
                  <StatusBadge status={w.status} className="hidden sm:inline-flex" />
                </>
              );
              return (
                <li key={w.id}>
                  {jobHref ? (
                    <Link href={jobHref(w.id)} className="flex items-center gap-2 rounded-lg border bg-white p-2.5 hover:border-steel-400">
                      {inner}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border bg-white p-2.5">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function SectionHeading({ icon: Icon, title, lg, tone = "navy" }: { icon: React.ComponentType<{ className?: string }>; title: string; lg: boolean; tone?: string }) {
  return (
    <h3
      className={cn(
        "eyebrow mb-2 flex items-center gap-1.5",
        lg && "text-xs",
        tone === "safety" ? "text-red-700" : "text-steel-600",
      )}
    >
      <Icon className="size-3.5" /> {title}
    </h3>
  );
}

function Section({
  icon,
  title,
  items,
  ordered,
  lg,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: string[];
  ordered?: boolean;
  lg: boolean;
  tone: "navy" | "safety" | "plain";
}) {
  if (!items.length) return null;
  return (
    <div className={cn(tone === "safety" && "rounded-xl border-l-4 border-red-600 bg-red-50 p-3.5")}>
      <SectionHeading icon={icon} title={title} lg={lg} tone={tone} />
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className={cn("flex gap-2.5 text-ink", lg ? "text-base" : "text-sm")}>
            {ordered ? (
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-orange font-display text-xs font-extrabold text-ink">
                {i + 1}
              </span>
            ) : (
              <span className={cn("mt-2 size-1.5 shrink-0 rounded-full", tone === "safety" ? "bg-red-600" : "bg-steel-400")} />
            )}
            <span className={cn(ordered && "pt-0.5")}>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
