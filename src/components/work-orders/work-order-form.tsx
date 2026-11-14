"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PRIORITY_ORDER, PRIORITY_META, WORK_TYPE_LABEL } from "@/lib/domain/constants";
import type { Priority, WorkOrder, WorkType } from "@/lib/domain/types";
import { addDays, toDateKey } from "@/lib/dates";
import { actions, useData } from "@/lib/store/app-store";
import { fullName } from "@/lib/selectors";
import type { WorkOrderInput } from "@/lib/services/commands";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const NONE = "__none__";

/** Slide-over for creating or editing a work order (admin & supervisor). */
export function WorkOrderFormSheet({
  open,
  onOpenChange,
  workOrder,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  workOrder?: WorkOrder;
  onSaved?: (id: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-xl data-[side=right]:sm:max-w-xl">
        {open && (
          <WorkOrderForm
            key={workOrder?.id ?? "new"}
            workOrder={workOrder}
            onCancel={() => onOpenChange(false)}
            onSaved={(id) => {
              onOpenChange(false);
              onSaved?.(id);
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function WorkOrderForm({
  workOrder,
  onCancel,
  onSaved,
}: {
  workOrder?: WorkOrder;
  onCancel: () => void;
  onSaved: (id: string) => void;
}) {
  const data = useData();
  const editing = !!workOrder;
  const me = data.session.employeeId;
  const [form, setForm] = useState<WorkOrderInput>(() => ({
    customerId: workOrder?.customerId ?? data.customers[0].id,
    title: workOrder?.title ?? "",
    description: workOrder?.description ?? "",
    workType: workOrder?.workType ?? "retipping",
    priority: workOrder?.priority ?? "normal",
    assigneeId: workOrder?.assigneeId ?? null,
    supervisorId: workOrder?.supervisorId ?? (data.session.role === "supervisor" ? me : null),
    dueDate: workOrder?.dueDate ?? toDateKey(addDays(new Date(), 3)),
    estimatedHours: workOrder?.estimatedHours ?? 4,
    instructions: workOrder?.instructions ?? [],
    status: "ready",
  }));
  const [instructionsText, setInstructionsText] = useState(form.instructions.join("\n"));
  const [submitted, setSubmitted] = useState(false);
  const set = <K extends keyof WorkOrderInput>(k: K, v: WorkOrderInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const workers = data.employees.filter((e) => e.role === "worker" && e.active);
  const supervisors = data.employees.filter((e) => e.role !== "worker" && e.active);
  const titleError = submitted && !form.title.trim();

  function save(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!form.title.trim()) return;
    const input = { ...form, instructions: instructionsText.split("\n").map((s) => s.trim()).filter(Boolean) };
    if (editing && workOrder) {
      const { status: _status, ...rest } = input;
      void _status;
      if (actions.updateWorkOrder(workOrder.id, rest)) {
        toast.success(`${workOrder.number} updated`);
        onSaved(workOrder.id);
      }
    } else {
      const id = actions.createWorkOrder(input);
      if (id) {
        const wo = id.replace("wo-", "WO-");
        toast.success(`${wo} created`, {
          description: input.status === "ready" ? "Released to the shop floor." : "Saved as New — not yet released to the shop.",
        });
        onSaved(id);
      }
    }
  }

  return (
    <form onSubmit={save} className="flex h-full flex-col" noValidate>
      <SheetHeader className="border-b p-5">
        <SheetTitle className="font-display text-xl font-extrabold text-navy">
          {editing ? `Edit ${workOrder.number}` : "New work order"}
        </SheetTitle>
        <SheetDescription>
          {editing ? "Changes are logged in the job's activity history." : "Create a job for the shop. You can release it now or keep it as New."}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <Field label="Job title" htmlFor="wo-title" error={titleError ? "A job title is required." : undefined}>
          <Input
            id="wo-title"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder='e.g. Retip 12¼" Tricone Bit'
            aria-invalid={titleError || undefined}
            autoFocus
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer / department">
            <Select value={form.customerId} onValueChange={(v) => set("customerId", v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Customers</SelectLabel>
                  {data.customers.filter((c) => c.kind === "external").map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Internal</SelectLabel>
                  {data.customers.filter((c) => c.kind === "internal").map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Work type">
            <Select value={form.workType} onValueChange={(v) => set("workType", v as WorkType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(WORK_TYPE_LABEL) as WorkType[]).map((t) => (
                  <SelectItem key={t} value={t}>{WORK_TYPE_LABEL[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Priority">
          <div className="grid grid-cols-4 gap-2">
            {PRIORITY_ORDER.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => set("priority", p as Priority)}
                className={`h-9 rounded-md border text-sm font-semibold transition ${
                  form.priority === p ? "border-navy bg-navy text-white" : "border-input bg-white text-steel-700 hover:border-steel-400"
                }`}
                aria-pressed={form.priority === p}
              >
                {PRIORITY_META[p].label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Description" htmlFor="wo-desc">
          <Textarea id="wo-desc" value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="What needs to be done and why." />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Assigned worker">
            <Select value={form.assigneeId ?? NONE} onValueChange={(v) => set("assigneeId", v === NONE ? null : v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Unassigned</SelectItem>
                {workers.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {fullName(w)} <span className="text-muted-foreground">· {w.position}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Supervisor">
            <Select value={form.supervisorId ?? NONE} onValueChange={(v) => set("supervisorId", v === NONE ? null : v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {supervisors.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{fullName(w)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Target completion" htmlFor="wo-due">
            <Input id="wo-due" type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
          </Field>
          <Field label="Estimated hours" htmlFor="wo-hours">
            <Input
              id="wo-hours"
              type="number"
              min={0.5}
              step={0.5}
              value={form.estimatedHours}
              onChange={(e) => set("estimatedHours", Number(e.target.value) || 0)}
            />
          </Field>
        </div>

        <Field label="Shop instructions" htmlFor="wo-ins" hint="One step per line. Workers see these as a checklist.">
          <Textarea
            id="wo-ins"
            value={instructionsText}
            onChange={(e) => setInstructionsText(e.target.value)}
            rows={4}
            placeholder={"Inspect before starting\nPhoto before and after\nStage for Quality Check"}
          />
        </Field>

        {!editing && (
          <Field label="Release">
            <RadioGroup value={form.status} onValueChange={(v) => set("status", v as "new" | "ready")} className="gap-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-3 has-[[data-state=checked]]:border-navy has-[[data-state=checked]]:ring-1 has-[[data-state=checked]]:ring-navy">
                <RadioGroupItem value="ready" className="mt-0.5" />
                <span>
                  <span className="block text-sm font-semibold">Ready for Shop</span>
                  <span className="text-xs text-muted-foreground">Appears in the assigned worker&apos;s app right away.</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-3 has-[[data-state=checked]]:border-navy has-[[data-state=checked]]:ring-1 has-[[data-state=checked]]:ring-navy">
                <RadioGroupItem value="new" className="mt-0.5" />
                <span>
                  <span className="block text-sm font-semibold">Keep as New</span>
                  <span className="text-xs text-muted-foreground">Office still confirming details. Not released to the floor.</span>
                </span>
              </label>
            </RadioGroup>
          </Field>
        )}
      </div>

      <SheetFooter className="flex-row justify-end gap-2 border-t bg-muted/40 p-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="brand">
          {editing ? "Save changes" : "Create work order"}
        </Button>
      </SheetFooter>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-[0.8rem] font-semibold text-steel-700">
        {label}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
