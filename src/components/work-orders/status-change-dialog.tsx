"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { checkTransition } from "@/lib/auth/permissions";
import { STATUS_META } from "@/lib/domain/constants";
import type { WorkOrder, WorkOrderStatus } from "@/lib/domain/types";
import { actions, useData } from "@/lib/store/app-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/badges";

/** Confirmation step for any status transition (board drag, menus, buttons). */
export function StatusChangeDialog({
  workOrder,
  to,
  onOpenChange,
  onDone,
}: {
  workOrder: WorkOrder | null;
  to: WorkOrderStatus | null;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
}) {
  const data = useData();
  const open = !!workOrder && !!to;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {workOrder && to && (
        <StatusChangeBody
          key={`${workOrder.id}-${to}`}
          workOrder={workOrder}
          to={to}
          role={data.session.role}
          actorId={data.session.employeeId}
          onClose={() => onOpenChange(false)}
          onDone={onDone}
        />
      )}
    </Dialog>
  );
}

function StatusChangeBody({
  workOrder,
  to,
  role,
  actorId,
  onClose,
  onDone,
}: {
  workOrder: WorkOrder;
  to: WorkOrderStatus;
  role: Parameters<typeof checkTransition>[0];
  actorId: string;
  onClose: () => void;
  onDone?: () => void;
}) {
  const [note, setNote] = useState("");
  const check = checkTransition(role, workOrder, to, actorId);
  const needsNote = to === "on_hold" || to === "cancelled" || to === "blocked";

  function confirm() {
    if (needsNote && !note.trim()) {
      toast.error("Add a short reason so the shop knows why.");
      return;
    }
    const ok = actions.changeStatus(workOrder.id, to, note);
    if (ok) {
      toast.success(`${workOrder.number} → ${STATUS_META[to].label}`);
      onDone?.();
      onClose();
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="font-display text-lg font-extrabold text-navy">Move {workOrder.number}?</DialogTitle>
        <DialogDescription className="line-clamp-1">{workOrder.title}</DialogDescription>
      </DialogHeader>
      <div className="flex items-center gap-2">
        <StatusBadge status={workOrder.status} />
        <ArrowRight className="size-4 text-steel-400" />
        <StatusBadge status={to} />
      </div>
      <p className="text-sm text-muted-foreground">{STATUS_META[to].description}</p>
      {!check.allowed && (
        <div className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {check.reason}
        </div>
      )}
      {check.warning && (
        <div className="flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {check.warning}
        </div>
      )}
      {check.allowed && (
        <div className="space-y-1.5">
          <Label htmlFor="status-note">
            {needsNote ? "Reason (required)" : "Note (optional)"}
          </Label>
          <Textarea
            id="status-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={needsNote ? "e.g. Waiting on customer approval" : "Anything the shop should know?"}
            rows={2}
          />
        </div>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={confirm} disabled={!check.allowed}>
          Confirm move
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
