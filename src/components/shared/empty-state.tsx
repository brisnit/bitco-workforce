import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-steel-200 bg-white/60 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-steel-100 text-steel-500">
        <Icon className="size-5" />
      </div>
      <p className="font-display font-bold text-navy">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
