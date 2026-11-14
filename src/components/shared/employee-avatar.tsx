import type { Employee } from "@/lib/domain/types";
import { WORK_STATUS_META } from "@/lib/domain/constants";
import { cn } from "@/lib/utils";

const TONES = [
  "bg-navy text-white",
  "bg-ocean text-white",
  "bg-orange text-ink",
  "bg-amber text-ink",
  "bg-cyan text-ink",
  "bg-steel-600 text-white",
  "bg-deep text-cyan",
];

function toneFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

export function initials(e: Pick<Employee, "firstName" | "lastName">) {
  return `${e.firstName[0] ?? ""}${e.lastName[0] ?? ""}`.toUpperCase() || "?";
}

const SIZES = {
  xs: "size-6 text-[0.6rem]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
  xl: "size-20 text-2xl",
};

export function EmployeeAvatar({
  employee,
  size = "sm",
  showStatus = false,
  className,
}: {
  employee: Pick<Employee, "id" | "firstName" | "lastName" | "workStatus" | "avatarUrl"> | undefined;
  size?: keyof typeof SIZES;
  showStatus?: boolean;
  className?: string;
}) {
  if (!employee) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-steel-300 bg-white text-steel-400",
          SIZES[size],
          className,
        )}
        aria-label="Unassigned"
      >
        –
      </span>
    );
  }
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full font-display font-bold tracking-tight",
          SIZES[size],
          toneFor(employee.id),
        )}
        aria-hidden
      >
        {initials(employee)}
      </span>
      {showStatus && (
        <span
          className={cn(
            "absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-white",
            WORK_STATUS_META[employee.workStatus].dot,
          )}
          title={WORK_STATUS_META[employee.workStatus].label}
        />
      )}
    </span>
  );
}
