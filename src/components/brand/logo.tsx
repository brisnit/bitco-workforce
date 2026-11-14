import Image from "next/image";
import { cn } from "@/lib/utils";

/** Authentic BITCO mark (from the BITCO website) + Workforce wordmark. */
export function BitcoMark({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <Image
      src={tone === "light" ? "/brand/bitco-mark-light.png" : "/brand/bitco-mark-dark.png"}
      alt="BITCO"
      width={202}
      height={212}
      priority
      className={cn("h-9 w-auto select-none", className)}
    />
  );
}

export function WorkforceLogo({
  tone = "light",
  compact = false,
  className,
}: {
  tone?: "light" | "dark";
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BitcoMark tone={tone} className="h-9" />
      {!compact && (
        <div className="leading-none">
          <div
            className={cn(
              "font-display text-[1.05rem] font-extrabold tracking-[-0.02em]",
              tone === "light" ? "text-white" : "text-navy",
            )}
          >
            BITCO
          </div>
          <div
            className={cn(
              "mt-0.5 font-display text-[0.6rem] font-bold tracking-[0.22em] uppercase",
              tone === "light" ? "text-orange" : "text-orange-700",
            )}
          >
            Workforce
          </div>
        </div>
      )}
    </div>
  );
}
