import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  tone = "orange",
  size = "sm",
}: {
  value: number;
  className?: string;
  tone?: "orange" | "navy" | "green";
  size?: "sm" | "md" | "lg";
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full bg-steel-100",
        size === "sm" ? "h-1.5" : size === "md" ? "h-2.5" : "h-3.5",
        className,
      )}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500",
          tone === "orange" ? "bg-orange" : tone === "navy" ? "bg-navy" : "bg-emerald-500",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
