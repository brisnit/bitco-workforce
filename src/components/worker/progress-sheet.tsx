"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import type { WorkOrder } from "@/lib/domain/types";
import { actions } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PhotoInput, type PickedPhoto } from "@/components/shared/photo-input";
import { DictationButton } from "@/components/shared/dictation-button";

export function ProgressSheet({ wo, onOpenChange, onReportProblem }: { wo: WorkOrder | null; onOpenChange: (o: boolean) => void; onReportProblem?: () => void }) {
  return (
    <Sheet open={!!wo} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[92dvh] max-w-md overflow-y-auto rounded-t-3xl p-0">
        {wo && <Body key={wo.id} wo={wo} onClose={() => onOpenChange(false)} onReportProblem={onReportProblem} />}
      </SheetContent>
    </Sheet>
  );
}

function Body({ wo, onClose, onReportProblem }: { wo: WorkOrder; onClose: () => void; onReportProblem?: () => void }) {
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(wo.progress);
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [toQc, setToQc] = useState(false);

  function submit() {
    const attachmentIds: string[] = [];
    if (photo) {
      const id = actions.addAttachment({ url: photo.url, name: photo.name, caption: `Progress photo · ${wo.number}` });
      if (id) attachmentIds.push(id);
    }
    const ok = actions.submitProgress(wo.id, {
      message,
      progress: progress !== wo.progress ? progress : undefined,
      attachmentIds,
      status: toQc ? "quality_check" : undefined,
    });
    if (ok) {
      toast.success(toQc ? `${wo.number} sent to Quality Check` : "Update posted", {
        description: "The office and your supervisor can see it on the dashboard.",
      });
      onClose();
    }
  }

  return (
    <div className="p-5">
      <SheetHeader className="p-0 text-left">
        <SheetTitle className="font-display text-2xl font-extrabold text-navy">Update progress</SheetTitle>
        <SheetDescription className="text-base">
          {wo.number} · {wo.title}
        </SheetDescription>
      </SheetHeader>
      <div className="mt-5 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="upd" className="text-base font-semibold text-navy">What&apos;s the update?</Label>
          <Textarea id="upd" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="min-h-24 text-base" placeholder="e.g. Cone 3 done, cleaning up now" />
          <DictationButton size="lg" onTranscript={(t) => setMessage((m) => (m ? `${m} ${t}` : t))} />
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <Label className="text-base font-semibold text-navy">How far along?</Label>
            <span className="tabular font-mono text-2xl font-bold text-navy">{progress}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="h-10 w-full accent-[#ff6100]"
            aria-label="Progress percent"
          />
          <div className="grid grid-cols-4 gap-2">
            {[25, 50, 75, 100].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProgress(p)}
                className={cn("h-12 rounded-xl border-2 font-mono text-base font-bold", progress === p ? "border-navy bg-navy text-white" : "border-steel-200 bg-white")}
              >
                {p}%
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-base font-semibold text-navy">Photo (optional)</Label>
          <PhotoInput value={photo} onChange={setPhoto} size="lg" label="Take or attach photo" />
        </div>
        <label className={cn("flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4", toQc ? "border-violet-500 bg-violet-50" : "border-steel-200 bg-white")}>
          <input type="checkbox" checked={toQc} onChange={(e) => setToQc(e.target.checked)} className="size-6 accent-violet-600" />
          <span>
            <span className="block font-semibold text-ink">Work is done — mark ready for Quality Check</span>
            <span className="text-sm text-muted-foreground">A supervisor inspects and signs off. You can&apos;t mark it Completed yourself.</span>
          </span>
        </label>
        <div className="space-y-2">
          <Button variant="brand" size="xl" className="w-full" onClick={submit}>
            <CheckCircle2 /> Send update
          </Button>
          {onReportProblem && (
            <Button variant="outline" size="xl" className="w-full text-red-700" onClick={onReportProblem}>
              Report a problem instead
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
