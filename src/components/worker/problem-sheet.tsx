"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ReportProblemForm } from "@/components/work-orders/report-problem-form";

export function ProblemSheet({ open, workOrderId, onOpenChange }: { open: boolean; workOrderId?: string | null; onOpenChange: (o: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[92dvh] max-w-md overflow-y-auto rounded-t-3xl p-5">
        <SheetHeader className="p-0 text-left">
          <SheetTitle className="font-display text-2xl font-extrabold text-red-700">Report a problem</SheetTitle>
          <SheetDescription className="text-base">Your supervisor and the office will see it right away on the dashboard.</SheetDescription>
        </SheetHeader>
        {open && <ReportProblemForm large workOrderId={workOrderId} onDone={() => onOpenChange(false)} onCancel={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}
