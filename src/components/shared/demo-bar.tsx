"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, FlaskConical, Info, RotateCcw, ShieldAlert } from "lucide-react";
import { homePathForRole } from "@/lib/auth/permissions";
import { ROLE_LABEL } from "@/lib/domain/constants";
import type { Role } from "@/lib/domain/types";
import { actions, useData } from "@/lib/store/app-store";
import { currentEmployee, fullName } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmployeeAvatar } from "./employee-avatar";
import { AboutDemoDialog } from "./about-demo-dialog";

/**
 * Persistent demo control strip: simulated role switcher, data reset and an
 * explanation of what the prototype does and does not do.
 */
export function DemoBar({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const data = useData();
  const router = useRouter();
  const me = currentEmployee(data);
  const [resetOpen, setResetOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const groups: { role: Role; label: string }[] = [
    { role: "admin", label: "Admin / Owner" },
    { role: "supervisor", label: "Shop Supervisors" },
    { role: "worker", label: "Shop Workers" },
  ];

  function switchTo(id: string) {
    const emp = data.employees.find((e) => e.id === id);
    if (!emp) return;
    actions.switchUser(id);
    toast.success(`Now viewing as ${fullName(emp)}`, { description: `${ROLE_LABEL[emp.role]} · simulated role` });
    router.push(homePathForRole(emp.role));
  }

  return (
    <div
      className={cn(
        "relative z-40 flex h-10 shrink-0 items-center gap-2 bg-ink px-3 text-[0.8rem] text-white/80",
        variant === "mobile" && "h-11",
      )}
    >
      <span className="hazard-stripe absolute inset-x-0 bottom-0 h-[2px] opacity-80" aria-hidden />
      <span className="inline-flex items-center gap-1.5 rounded-sm bg-orange px-1.5 py-0.5 font-display text-[0.65rem] font-extrabold tracking-[0.12em] text-ink uppercase">
        <FlaskConical className="size-3" /> Demo
      </span>
      <button
        onClick={() => setAboutOpen(true)}
        className="hidden min-w-0 items-center gap-1.5 truncate text-white/70 hover:text-white md:inline-flex"
      >
        <ShieldAlert className="size-3.5 shrink-0 text-amber" />
        <span className="truncate">Simulated roles · data saved in this browser only · not synced between users or devices</span>
        <Info className="size-3.5 shrink-0" />
      </button>
      <button onClick={() => setAboutOpen(true)} className="text-white/70 hover:text-white md:hidden" aria-label="About this demo">
        <Info className="size-4" />
      </button>

      <div className="ml-auto flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-8 items-center gap-2 rounded-md px-2 text-white outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-orange">
            <span className="hidden text-white/60 sm:inline">Viewing as</span>
            <EmployeeAvatar employee={me} size="xs" />
            <span className="max-w-[9rem] truncate font-semibold">{me.firstName}</span>
            <span className="hidden rounded-sm bg-white/10 px-1.5 py-px font-display text-[0.62rem] font-bold tracking-wider text-cyan uppercase sm:inline">
              {me.role}
            </span>
            <ChevronDown className="size-3.5 text-white/60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Switch demo role — <strong className="text-foreground">no login, not secure authorization</strong>
            </DropdownMenuLabel>
            {groups.map((g) => (
              <DropdownMenuGroup key={g.role}>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="eyebrow pt-2 text-steel-500">{g.label}</DropdownMenuLabel>
                {data.employees
                  .filter((e) => e.role === g.role && e.active)
                  .map((e) => (
                    <DropdownMenuItem key={e.id} onSelect={() => switchTo(e.id)} className="gap-2.5">
                      <EmployeeAvatar employee={e} size="xs" />
                      <span className="flex-1 truncate">
                        {fullName(e)}
                        <span className="ml-1.5 text-xs text-muted-foreground">{e.position}</span>
                      </span>
                      {e.id === me.id && <span className="size-2 rounded-full bg-orange" aria-label="current" />}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuGroup>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setAboutOpen(true)}>
              <Info /> About this prototype
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setResetOpen(true)} variant="destructive">
              <RotateCcw /> Reset demo data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ResetDemoDialog open={resetOpen} onOpenChange={setResetOpen} />
      <AboutDemoDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </div>
  );
}

export function ResetDemoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset demo data?</AlertDialogTitle>
          <AlertDialogDescription>
            This restores the original sample work orders, briefings, messages and problem reports in this browser. Anything
            you created or changed in the demo will be erased. You&apos;ll be switched back to Eran (Owner).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              actions.resetDemo();
              toast.success("Demo data reset", { description: "Sample data restored in this browser." });
              router.push("/dashboard");
            }}
          >
            Reset data
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
