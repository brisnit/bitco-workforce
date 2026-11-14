import { Check } from "lucide-react";
import { PRODUCTION_FLOW, STATUS_META } from "@/lib/domain/constants";
import type { WorkOrderStatus } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

/** Visual lifecycle: New → Ready → In Progress → QC → Completed. */
export function StatusStepper({
  status,
  resumeStatus,
  size = "md",
}: {
  status: WorkOrderStatus;
  resumeStatus?: WorkOrderStatus;
  size?: "md" | "lg";
}) {
  const effective = status === "blocked" || status === "on_hold" ? resumeStatus ?? "ready" : status;
  const idx = PRODUCTION_FLOW.indexOf(effective);
  const halted = status === "blocked" || status === "on_hold";
  const cancelled = status === "cancelled";
  return (
    <ol className="flex items-center">
      {PRODUCTION_FLOW.map((s, i) => {
        const done = !cancelled && (i < idx || status === "completed");
        const current = !cancelled && i === idx && status !== "completed";
        return (
          <li key={s} className={cn("flex items-center", i < PRODUCTION_FLOW.length - 1 && "flex-1")}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex items-center justify-center rounded-full border-2 font-display font-bold",
                  size === "lg" ? "size-9 text-sm" : "size-7 text-xs",
                  done && "border-navy bg-navy text-white",
                  current && !halted && "border-orange bg-orange text-ink ring-4 ring-orange/20",
                  current && halted && (status === "blocked" ? "border-red-600 bg-red-600 text-white ring-4 ring-red-200" : "border-stone-400 bg-stone-300 text-stone-800"),
                  !done && !current && "border-steel-200 bg-white text-steel-400",
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-center leading-tight whitespace-nowrap",
                  size === "lg" ? "text-xs" : "text-[0.68rem]",
                  current ? "font-bold text-navy" : done ? "font-medium text-steel-700" : "text-steel-400",
                )}
              >
                {STATUS_META[s].short}
                {current && halted && (
                  <span className={cn("block font-bold uppercase", status === "blocked" ? "text-red-600" : "text-stone-600")}>
                    {STATUS_META[status].label}
                  </span>
                )}
              </span>
            </div>
            {i < PRODUCTION_FLOW.length - 1 && (
              <span className={cn("mx-1 mb-5 h-0.5 flex-1 rounded", i < idx || status === "completed" ? "bg-navy" : "bg-steel-200")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
