"use client";

import { useState } from "react";
import type { Attachment } from "@/lib/domain/types";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function ImageGallery({ items, className, large = false }: { items: Attachment[]; className?: string; large?: boolean }) {
  const [open, setOpen] = useState<Attachment | null>(null);
  return (
    <>
      <div className={cn("grid gap-3", large ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3", className)}>
        {items.map((a) => (
          <button
            key={a.id}
            onClick={() => setOpen(a)}
            className="group overflow-hidden rounded-lg border bg-steel-50 text-left transition hover:border-steel-400"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.url} alt={a.name} className="aspect-[3/2] w-full object-cover transition group-hover:scale-[1.02]" />
            <div className="border-t bg-white px-2.5 py-1.5">
              <p className="truncate text-xs font-semibold text-navy">{a.name}</p>
              {a.isReference && <p className="truncate text-[0.65rem] text-muted-foreground">Illustrative reference · demo</p>}
            </div>
          </button>
        ))}
      </div>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogTitle>{open?.name}</DialogTitle>
          <DialogDescription>{open?.caption ?? "Attached photo"}</DialogDescription>
          {open && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={open.url} alt={open.name} className="max-h-[70vh] w-full rounded-lg object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
