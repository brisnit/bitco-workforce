"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { AppData, Employee } from "@/lib/domain/types";
import { actions } from "@/lib/store/app-store";
import { fullName } from "@/lib/selectors";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmployeeAvatar } from "@/components/shared/employee-avatar";

export function NewMessageDialog({
  data,
  viewer,
  open,
  onOpenChange,
  onOpened,
}: {
  data: AppData;
  viewer: Employee;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onOpened: (threadId: string) => void;
}) {
  const [q, setQ] = useState("");
  const people = data.employees
    .filter((e) => e.id !== viewer.id && e.active)
    .filter((e) => `${fullName(e)} ${e.position}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
          <DialogDescription>Start a direct conversation.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-steel-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people" className="pl-8" autoFocus />
        </div>
        <ul className="max-h-80 overflow-y-auto">
          {people.map((e) => (
            <li key={e.id}>
              <button
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-steel-50"
                onClick={() => {
                  const id = actions.openDirectThread(e.id);
                  if (id) {
                    onOpenChange(false);
                    onOpened(id);
                  }
                }}
              >
                <EmployeeAvatar employee={e} size="sm" />
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{fullName(e)}</span>
                  <span className="text-xs text-muted-foreground">{e.position}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
