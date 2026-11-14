"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Home, MessagesSquare, UserRound } from "lucide-react";
import { useData } from "@/lib/store/app-store";
import { currentEmployee, totalUnread, workOrdersForEmployee } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { DemoBar } from "@/components/shared/demo-bar";
import { RoleGate } from "@/components/dashboard/role-gate";

/** Mobile-first app frame. On desktop it is centered at phone width. */
export function WorkerShell({ children }: { children: React.ReactNode }) {
  const data = useData();
  const pathname = usePathname();
  const me = currentEmployee(data);
  const isWorker = data.session.role === "worker";
  const unread = isWorker ? totalUnread(data, me) : 0;
  const activeJobs = isWorker
    ? workOrdersForEmployee(data, me.id).filter((w) => ["ready", "in_progress", "blocked"].includes(w.status)).length
    : 0;

  const tabs = [
    { href: "/worker", label: "Today", icon: Home, exact: true },
    { href: "/worker/jobs", label: "My Jobs", icon: ClipboardList, badge: activeJobs, tone: "navy" as const },
    { href: "/worker/messages", label: "Messages", icon: MessagesSquare, badge: unread, tone: "orange" as const },
    { href: "/worker/profile", label: "Profile", icon: UserRound },
  ];

  return (
    <div className="min-h-dvh bg-[#d9dde2] md:py-6">
      <div className="relative mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-warm-white shadow-2xl md:h-[calc(100dvh-3rem)] md:rounded-[2rem] md:border-[6px] md:border-ink">
        <DemoBar variant="mobile" />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <RoleGate allow={["worker"]}>{children}</RoleGate>
        </main>
        {isWorker && (
          <nav className="safe-bottom shrink-0 border-t bg-white" aria-label="Worker navigation">
            <ul className="grid grid-cols-4">
              {tabs.map((t) => {
                const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
                return (
                  <li key={t.href}>
                    <Link
                      href={t.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex h-[4.25rem] flex-col items-center justify-center gap-1 text-[0.72rem] font-bold tracking-wide uppercase",
                        active ? "text-navy" : "text-steel-500",
                      )}
                    >
                      {active && <span className="absolute inset-x-5 top-0 h-[3px] rounded-b bg-orange" />}
                      <span className="relative">
                        <t.icon className={cn("size-6", active && "text-navy")} strokeWidth={active ? 2.4 : 2} />
                        {!!t.badge && (
                          <span
                            className={cn(
                              "tabular absolute -top-1.5 -right-2.5 flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full px-1 text-[0.65rem]",
                              t.tone === "orange" ? "bg-orange text-ink" : "bg-navy text-white",
                            )}
                          >
                            {t.badge}
                          </span>
                        )}
                      </span>
                      {t.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
