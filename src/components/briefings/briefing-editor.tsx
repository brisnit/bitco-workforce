"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Copy, Eye, Plus, Send, Smartphone, Trash2, Users, X } from "lucide-react";
import type { Briefing, BriefingAudience } from "@/lib/domain/types";
import { formatLongDay, todayKey } from "@/lib/dates";
import { actions, useData } from "@/lib/store/app-store";
import { briefingRecipients, fullName, isActive, publishedBriefings, sortByUrgency } from "@/lib/selectors";
import type { BriefingInput } from "@/lib/services/commands";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Panel } from "@/components/shared/panel";
import { EmployeeAvatar } from "@/components/shared/employee-avatar";
import { PriorityBadge } from "@/components/shared/badges";
import { BriefingContent } from "./briefing-content";

const empty = (): BriefingInput => ({
  date: todayKey(),
  title: "",
  message: "",
  priorities: [""],
  safetyReminders: [""],
  equipmentUpdates: [],
  announcements: [],
  specialAttentionWorkOrderIds: [],
  audience: { type: "all" },
});

export function BriefingEditor({ briefing }: { briefing?: Briefing }) {
  const data = useData();
  const router = useRouter();
  const [form, setForm] = useState<BriefingInput>(() =>
    briefing
      ? {
          date: briefing.date,
          title: briefing.title,
          message: briefing.message,
          priorities: briefing.priorities,
          safetyReminders: briefing.safetyReminders,
          equipmentUpdates: briefing.equipmentUpdates,
          announcements: briefing.announcements,
          specialAttentionWorkOrderIds: briefing.specialAttentionWorkOrderIds,
          audience: briefing.audience,
        }
      : empty(),
  );
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const set = <K extends keyof BriefingInput>(k: K, v: BriefingInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const isPublished = briefing?.status === "published";

  const recipients = useMemo(
    () => briefingRecipients(data, { ...form, id: "preview" } as Briefing),
    [data, form],
  );
  const latest = publishedBriefings(data)[0];
  const activeJobs = data.workOrders.filter((w) => isActive(w)).sort(sortByUrgency);

  function save(publish: boolean) {
    setSubmitted(true);
    const id = actions.saveBriefing(form, { id: briefing?.id, publish });
    if (id) {
      toast.success(publish ? (isPublished ? "Briefing updated" : "Briefing published") : "Draft saved", {
        description: publish
          ? `Visible to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"} in the worker app (this browser only).`
          : "Only office users can see drafts.",
      });
      router.push(`/dashboard/briefings/${id}`);
    }
  }

  function copyFromLatest() {
    if (!latest) return;
    setForm((f) => ({
      ...f,
      title: latest.title,
      message: latest.message,
      priorities: latest.priorities,
      safetyReminders: latest.safetyReminders,
      equipmentUpdates: latest.equipmentUpdates,
      announcements: latest.announcements,
      specialAttentionWorkOrderIds: latest.specialAttentionWorkOrderIds.filter((id) => activeJobs.some((w) => w.id === id)),
      audience: latest.audience,
    }));
    toast.info("Copied from the latest briefing — edit before publishing.");
  }

  const preview = (
    <PhonePreview>
      <div className="bg-navy px-4 pt-5 pb-4 text-white steel-texture">
        <p className="eyebrow text-cyan">Today&apos;s shop briefing</p>
        <p className="mt-0.5 text-xs text-white/70">{formatLongDay(form.date)}</p>
        <p className="mt-2 font-display text-xl leading-tight font-extrabold">{form.title || "Briefing title"}</p>
      </div>
      <div className="p-4">
        <BriefingContent data={data} briefing={form} />
        <div className="mt-5 flex h-12 items-center justify-center rounded-xl bg-orange font-display text-sm font-extrabold tracking-wide text-ink uppercase">
          Got it — I&apos;ve read this
        </div>
      </div>
    </PhonePreview>
  );

  return (
    <div className="mx-auto max-w-[1440px] p-4 sm:p-6">
      <Link href="/dashboard/briefings" className="inline-flex items-center gap-1.5 text-sm font-medium text-steel-600 hover:text-navy">
        <ArrowLeft className="size-4" /> Daily briefings
      </Link>
      <div className="mt-3 mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-orange-700">{briefing ? (isPublished ? "Editing published briefing" : "Editing draft") : "New briefing"}</p>
          <h1 className="font-display text-2xl font-extrabold tracking-[-0.02em] text-navy sm:text-[1.7rem]">
            {briefing ? "Edit briefing" : "Create today's briefing"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {!briefing && latest && (
            <Button variant="outline" className="h-9 bg-white" onClick={copyFromLatest}>
              <Copy className="size-4" /> Start from latest
            </Button>
          )}
          <Button variant="outline" className="h-9 bg-white xl:hidden" onClick={() => setPreviewOpen(true)}>
            <Eye className="size-4" /> Preview
          </Button>
          {!isPublished && (
            <Button variant="outline" className="h-9 bg-white" onClick={() => save(false)}>
              Save draft
            </Button>
          )}
          <Button
            variant="brand"
            className="h-9"
            onClick={() => {
              setSubmitted(true);
              if (!form.title.trim() || !form.message.trim()) {
                toast.error("Add a title and a general message before publishing.");
                return;
              }
              setConfirmPublish(true);
            }}
          >
            <Send className="size-4" /> {isPublished ? "Update published" : "Publish"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-5">
          <Panel title="Basics" bodyClassName="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
              <div className="space-y-1.5">
                <Label htmlFor="b-date">Date</Label>
                <Input id="b-date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-title">Briefing title</Label>
                <Input
                  id="b-title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Two customer pickups this afternoon"
                  aria-invalid={(submitted && !form.title.trim()) || undefined}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-msg">General message</Label>
              <Textarea
                id="b-msg"
                rows={4}
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                placeholder="What does the whole shop need to know this morning?"
                aria-invalid={(submitted && !form.message.trim()) || undefined}
              />
              <p className="text-xs text-muted-foreground">Keep it short — workers read this on a phone, often with gloves on.</p>
            </div>
          </Panel>

          <div className="grid gap-5 lg:grid-cols-2">
            <ListEditor label="Today's priorities" placeholder="e.g. WO-1042 — finish retip before 3:00 PM" items={form.priorities} onChange={(v) => set("priorities", v)} />
            <ListEditor label="Safety reminders" placeholder="e.g. Face shields on at the grinders" items={form.safetyReminders} onChange={(v) => set("safetyReminders", v)} tone="safety" />
            <ListEditor label="Equipment updates" placeholder="e.g. CNC mill #2 back in service" items={form.equipmentUpdates} onChange={(v) => set("equipmentUpdates", v)} />
            <ListEditor label="Shop announcements" placeholder="e.g. Shop meeting Monday 6:45 AM" items={form.announcements} onChange={(v) => set("announcements", v)} />
          </div>

          <Panel title="Jobs requiring special attention" bodyClassName="p-2">
            <ul className="max-h-72 divide-y overflow-y-auto">
              {activeJobs.map((w) => {
                const checked = form.specialAttentionWorkOrderIds.includes(w.id);
                return (
                  <li key={w.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-steel-50">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) =>
                          set(
                            "specialAttentionWorkOrderIds",
                            v ? [...form.specialAttentionWorkOrderIds, w.id] : form.specialAttentionWorkOrderIds.filter((x) => x !== w.id),
                          )
                        }
                      />
                      <span className="font-mono text-xs font-bold text-ocean">{w.number}</span>
                      <span className="flex-1 truncate text-sm">{w.title}</span>
                      <PriorityBadge priority={w.priority} />
                    </label>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <AudiencePicker audience={form.audience} onChange={(a) => set("audience", a)} recipientsCount={recipients.length} />
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-6 space-y-3">
            <p className="eyebrow flex items-center gap-1.5 text-steel-500">
              <Smartphone className="size-3.5" /> Worker preview
            </p>
            {preview}
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="size-3.5" /> {recipients.length} recipient{recipients.length === 1 ? "" : "s"}
            </p>
          </div>
        </aside>
      </div>

      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent className="overflow-y-auto bg-steel-100 p-4 sm:max-w-md data-[side=right]:sm:max-w-md">
          <SheetHeader className="p-0">
            <SheetTitle>Worker preview</SheetTitle>
            <SheetDescription>How the briefing looks in the shop app.</SheetDescription>
          </SheetHeader>
          {preview}
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmPublish} onOpenChange={setConfirmPublish}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isPublished ? "Update this briefing?" : "Publish this briefing?"}</AlertDialogTitle>
            <AlertDialogDescription>
              It will appear first in the worker app for {recipients.length} recipient{recipients.length === 1 ? "" : "s"} on{" "}
              {formatLongDay(form.date)}. In this prototype, &ldquo;delivery&rdquo; means visible to demo roles in this browser — no
              notifications are sent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-wrap gap-1">
            {recipients.map((e) => (
              <span key={e.id} title={fullName(e)}>
                <EmployeeAvatar employee={e} size="xs" />
              </span>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={() => save(true)}>{isPublished ? "Update" : "Publish"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PhonePreview({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[22rem] rounded-[2rem] border-[6px] border-ink bg-ink p-0 shadow-xl">
      <div className="max-h-[38rem] overflow-y-auto rounded-[1.6rem] bg-warm-white no-scrollbar">{children}</div>
    </div>
  );
}

function ListEditor({
  label,
  items,
  onChange,
  placeholder,
  tone,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  tone?: "safety";
}) {
  return (
    <Panel
      title={<h2 className={cn("eyebrow", tone === "safety" ? "text-red-700" : "text-steel-600")}>{label}</h2>}
      bodyClassName="space-y-2"
    >
      {items.map((it, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={it}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
            placeholder={placeholder}
            aria-label={`${label} item ${i + 1}`}
          />
          <Button variant="ghost" size="icon" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove item">
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" className="text-ocean" onClick={() => onChange([...items, ""])}>
        <Plus className="size-3.5" /> Add item
      </Button>
    </Panel>
  );
}

function AudiencePicker({
  audience,
  onChange,
  recipientsCount,
}: {
  audience: BriefingAudience;
  onChange: (a: BriefingAudience) => void;
  recipientsCount: number;
}) {
  const data = useData();
  const staff = data.employees.filter((e) => e.role !== "admin" && e.active);
  return (
    <Panel
      title="Audience"
      action={<span className="text-xs font-semibold text-navy">{recipientsCount} recipients</span>}
      bodyClassName="space-y-3"
    >
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ["all", "Entire shop"],
            ["team", "Specific team"],
            ["employees", "Specific employees"],
          ] as const
        ).map(([t, l]) => (
          <button
            key={t}
            type="button"
            onClick={() =>
              onChange(t === "all" ? { type: "all" } : t === "team" ? { type: "team", teamIds: [] } : { type: "employees", employeeIds: [] })
            }
            className={cn(
              "h-10 rounded-lg border text-sm font-semibold transition",
              audience.type === t ? "border-navy bg-navy text-white" : "bg-white text-steel-700 hover:border-steel-400",
            )}
            aria-pressed={audience.type === t}
          >
            {l}
          </button>
        ))}
      </div>
      {audience.type === "team" && (
        <div className="grid gap-2 sm:grid-cols-2">
          {data.teams.map((t) => (
            <label key={t.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg border bg-white p-2.5">
              <Checkbox
                checked={audience.teamIds.includes(t.id)}
                onCheckedChange={(v) =>
                  onChange({ type: "team", teamIds: v ? [...audience.teamIds, t.id] : audience.teamIds.filter((x) => x !== t.id) })
                }
              />
              <span className="text-sm font-medium">{t.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{staff.filter((e) => e.teamId === t.id).length}</span>
            </label>
          ))}
        </div>
      )}
      {audience.type === "employees" && (
        <div className="grid gap-2 sm:grid-cols-2">
          {staff.map((e) => (
            <label key={e.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg border bg-white p-2">
              <Checkbox
                checked={audience.employeeIds.includes(e.id)}
                onCheckedChange={(v) =>
                  onChange({
                    type: "employees",
                    employeeIds: v ? [...audience.employeeIds, e.id] : audience.employeeIds.filter((x) => x !== e.id),
                  })
                }
              />
              <EmployeeAvatar employee={e} size="xs" />
              <span className="truncate text-sm">{fullName(e)}</span>
            </label>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function DeleteBriefingButton({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" className="h-9 text-destructive" onClick={() => setOpen(true)}>
        <Trash2 className="size-4" /> Delete
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this briefing?</AlertDialogTitle>
            <AlertDialogDescription>Its acknowledgement records will also be removed from the demo data.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (actions.deleteBriefing(id)) {
                  toast.success("Briefing deleted");
                  onDeleted();
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
