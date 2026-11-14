import { cn } from "@/lib/utils";

export function Panel({
  title,
  action,
  children,
  className,
  bodyClassName,
  id,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("flex min-w-0 flex-col rounded-xl border bg-card shadow-[0_1px_0_rgb(3_38_65/0.04)]", className)}>
      {(title || action) && (
        <header className="flex min-h-12 items-center justify-between gap-3 border-b px-4 py-2.5">
          {typeof title === "string" ? <h2 className="eyebrow text-steel-600">{title}</h2> : title}
          {action}
        </header>
      )}
      <div className={cn("min-h-0 flex-1 p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
