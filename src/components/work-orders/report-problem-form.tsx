"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CircleHelp,
  Cog,
  HardHat,
  MoreHorizontal,
  PackageX,
  SearchCheck,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { BLOCKER_CATEGORY_LABEL, BLOCKER_URGENCY_META } from "@/lib/domain/constants";
import type { BlockerCategory, BlockerUrgency } from "@/lib/domain/types";
import { actions, useData } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhotoInput, type PickedPhoto } from "@/components/shared/photo-input";
import { DictationButton } from "@/components/shared/dictation-button";

const CATEGORY_ICON: Record<BlockerCategory, React.ComponentType<{ className?: string }>> = {
  missing_material: PackageX,
  equipment: Cog,
  tooling: Wrench,
  clarification: CircleHelp,
  quality: SearchCheck,
  safety: HardHat,
  other: MoreHorizontal,
};

const CATEGORIES: BlockerCategory[] = ["missing_material", "equipment", "tooling", "clarification", "quality", "safety", "other"];
const NONE = "__none__";

/**
 * Report a problem. Used in the worker app (large touch layout) and in the
 * dashboard. High urgency on an active job moves it to Blocked automatically.
 */
export function ReportProblemForm({
  workOrderId,
  large = false,
  onDone,
  onCancel,
}: {
  workOrderId?: string | null;
  large?: boolean;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const data = useData();
  const me = data.session.employeeId;
  const [category, setCategory] = useState<BlockerCategory | null>(null);
  const [urgency, setUrgency] = useState<BlockerUrgency>("medium");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [woId, setWoId] = useState<string | null>(workOrderId ?? null);
  const [submitted, setSubmitted] = useState(false);

  const jobOptions = data.workOrders
    .filter((w) => !["completed", "cancelled"].includes(w.status))
    .filter((w) => data.session.role !== "worker" || w.assigneeId === me)
    .sort((a, b) => a.number.localeCompare(b.number));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!category || !description.trim()) return;
    const attachmentIds: string[] = [];
    if (photo) {
      const id = actions.addAttachment({ url: photo.url, name: photo.name, caption: "Problem report photo" });
      if (id) attachmentIds.push(id);
    }
    const id = actions.reportBlocker({ workOrderId: woId, category, urgency, description, attachmentIds });
    if (id) {
      toast.success("Problem reported", {
        description:
          urgency === "high" && woId
            ? "The job is marked Blocked. It now shows under Needs Attention for the office."
            : "It now shows under Needs Attention for the office and your supervisor.",
      });
      onDone?.();
    }
  }

  const txt = large ? "text-base" : "text-sm";

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <fieldset>
        <legend className={cn("mb-2 font-semibold text-navy", txt)}>What&apos;s the problem?</legend>
        <div className={cn("grid gap-2", large ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4")}>
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICON[c];
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border-2 text-left font-semibold transition",
                  large ? "min-h-16 px-3.5 text-[0.95rem]" : "min-h-12 px-3 text-sm",
                  active
                    ? c === "safety"
                      ? "border-red-600 bg-red-50 text-red-800"
                      : "border-navy bg-navy text-white"
                    : "border-steel-200 bg-white text-steel-700 hover:border-steel-400",
                  c === "other" && large && "col-span-2",
                )}
              >
                <Icon className={cn("shrink-0", large ? "size-6" : "size-5", !active && c === "safety" && "text-red-600")} />
                {BLOCKER_CATEGORY_LABEL[c]}
              </button>
            );
          })}
        </div>
        {submitted && !category && <p className="mt-1.5 text-sm font-medium text-destructive">Pick a problem type.</p>}
      </fieldset>

      {category === "safety" && (
        <div className="flex gap-3 rounded-xl border-2 border-red-600 bg-red-50 p-4 text-red-900" role="alert">
          <ShieldAlert className="mt-0.5 size-6 shrink-0 text-red-600" />
          <div className={txt}>
            <p className="font-display font-extrabold uppercase">Stop unsafe work now.</p>
            <p className="mt-1">
              Tell your supervisor in person right away and follow the shop&apos;s established safety procedures. For an
              emergency, call 911. <strong>This app is not a safety or emergency reporting system</strong> — submitting
              this form is only a record, not a substitute.
            </p>
          </div>
        </div>
      )}

      <fieldset>
        <legend className={cn("mb-2 font-semibold text-navy", txt)}>How urgent?</legend>
        <div className="grid grid-cols-3 gap-2">
          {(["low", "medium", "high"] as BlockerUrgency[]).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUrgency(u)}
              aria-pressed={urgency === u}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl border-2 px-2 text-center transition",
                large ? "min-h-16" : "min-h-14",
                urgency === u
                  ? u === "high"
                    ? "border-red-600 bg-red-600 text-white"
                    : u === "medium"
                      ? "border-amber bg-amber-100 text-amber-950"
                      : "border-navy bg-navy text-white"
                  : "border-steel-200 bg-white text-steel-700",
              )}
            >
              <span className="font-display text-sm font-extrabold uppercase">{BLOCKER_URGENCY_META[u].label}</span>
              <span className="text-[0.7rem] leading-tight opacity-80">{BLOCKER_URGENCY_META[u].hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="problem-desc" className={cn("font-semibold text-navy", txt)}>
          Describe it in a few words
        </Label>
        <Textarea
          id="problem-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={cn(large && "min-h-24 text-base")}
          placeholder="e.g. Out of carbide inserts for the last two bits"
          aria-invalid={(submitted && !description.trim()) || undefined}
        />
        {submitted && !description.trim() && <p className="text-sm font-medium text-destructive">Add a short description.</p>}
        <DictationButton size={large ? "lg" : "md"} onTranscript={(t) => setDescription((d) => (d ? `${d} ${t}` : t))} />
      </div>

      <div className="space-y-2">
        <Label className={cn("font-semibold text-navy", txt)}>Photo (optional)</Label>
        <PhotoInput value={photo} onChange={setPhoto} size={large ? "lg" : "md"} label="Take or attach photo" />
      </div>

      <div className="space-y-2">
        <Label className={cn("font-semibold text-navy", txt)}>Related job</Label>
        <Select value={woId ?? NONE} onValueChange={(v) => setWoId(v === NONE ? null : v)}>
          <SelectTrigger className={cn("w-full", large && "h-12 text-base")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Not about a specific job</SelectItem>
            {jobOptions.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.number} — {w.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={cn("flex gap-2", large ? "flex-col-reverse" : "justify-end")}>
        {onCancel && (
          <Button type="button" variant="outline" size={large ? "xl" : "default"} onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant={category === "safety" ? "destructive" : "brand"} size={large ? "xl" : "default"} className={cn(category === "safety" && "bg-red-600 text-white hover:bg-red-700")}>
          Send problem report
        </Button>
      </div>
    </form>
  );
}
