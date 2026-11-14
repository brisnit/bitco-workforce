"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Blocker } from "@/lib/domain/types";
import { BLOCKER_CATEGORY_LABEL } from "@/lib/domain/constants";
import { actions, useData } from "@/lib/store/app-store";
import { employeeName, workOrderById } from "@/lib/selectors";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UrgencyBadge } from "@/components/shared/badges";

export function ResolveBlockerDialog({ blocker, onOpenChange }: { blocker: Blocker | null; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={!!blocker} onOpenChange={onOpenChange}>
      {blocker && <Body key={blocker.id} blocker={blocker} onClose={() => onOpenChange(false)} />}
    </Dialog>
  );
}

function Body({ blocker, onClose }: { blocker: Blocker; onClose: () => void }) {
  const data = useData();
  const wo = workOrderById(data, blocker.workOrderId);
  const [note, setNote] = useState("");
  const [resume, setResume] = useState(true);

  function resolve() {
    if (actions.resolveBlocker(blocker.id, note, resume)) {
      toast.success("Problem resolved", {
        description: wo && wo.status === "blocked" && resume ? `${wo.number} is back in the production flow.` : undefined,
      });
      onClose();
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="font-display text-lg font-extrabold text-navy">Resolve problem</DialogTitle>
        <DialogDescription>
          {BLOCKER_CATEGORY_LABEL[blocker.category]} · reported by {employeeName(data, blocker.reportedById)}
          {wo ? ` on ${wo.number}` : ""}
        </DialogDescription>
      </DialogHeader>
      <div className="rounded-lg bg-muted p-3 text-sm">
        <div className="mb-1">
          <UrgencyBadge urgency={blocker.urgency} />
        </div>
        &ldquo;{blocker.description}&rdquo;
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="resolution">What was done?</Label>
        <Textarea id="resolution" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Alternate supplier delivered inserts" />
      </div>
      {wo?.status === "blocked" && (
        <label className="flex items-start gap-2.5 text-sm">
          <Checkbox checked={resume} onCheckedChange={(v) => setResume(v === true)} className="mt-0.5" />
          <span>
            Unblock <strong>{wo.number}</strong> and return it to its previous stage
          </span>
        </label>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={resolve}>Mark resolved</Button>
      </DialogFooter>
    </DialogContent>
  );
}
