import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  href,
  tone = "default",
  children,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  tone?: "default" | "alert" | "brand";
  children?: React.ReactNode;
}) {
  const body = (
    <div
      className={cn(
        "group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border bg-card p-4 transition",
        href && "hover:border-steel-300 hover:shadow-sm",
        tone === "alert" && "border-red-200 bg-red-50/60",
        tone === "brand" && "border-navy bg-navy text-white",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn("eyebrow", tone === "brand" ? "text-cyan" : tone === "alert" ? "text-red-700" : "text-steel-500")}>
          {label}
        </span>
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-md",
            tone === "brand" ? "bg-white/10 text-orange" : tone === "alert" ? "bg-red-100 text-red-600" : "bg-steel-100 text-navy",
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3">
        <div className={cn("tabular font-display text-3xl font-extrabold tracking-tight", tone === "brand" ? "text-white" : tone === "alert" ? "text-red-700" : "text-navy")}>
          {value}
        </div>
        {sub && <div className={cn("mt-0.5 text-xs", tone === "brand" ? "text-white/70" : "text-muted-foreground")}>{sub}</div>}
        {children}
      </div>
      {href && (
        <ArrowUpRight className={cn("absolute right-3 bottom-3 size-4 opacity-0 transition group-hover:opacity-100", tone === "brand" ? "text-white/60" : "text-steel-400")} />
      )}
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full rounded-xl focus-visible:ring-2 focus-visible:ring-orange focus-visible:outline-none">
      {body}
    </Link>
  ) : (
    body
  );
}
