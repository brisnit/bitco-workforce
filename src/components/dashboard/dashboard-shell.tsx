"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Columns3,
  LayoutDashboard,
  Megaphone,
  Menu,
  MessagesSquare,
  Plus,
  Search,
  Settings,
  Smartphone,
  Users,
} from "lucide-react";
import { can, type Permission } from "@/lib/auth/permissions";
import { useData } from "@/lib/store/app-store";
import { currentEmployee, fullName, isActive, openBlockers, totalUnread } from "@/lib/selectors";
import { ROLE_LABEL } from "@/lib/domain/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WorkforceLogo } from "@/components/brand/logo";
import { DemoBar } from "@/components/shared/demo-bar";
import { EmployeeAvatar } from "@/components/shared/employee-avatar";
import { WorkOrderFormSheet } from "@/components/work-orders/work-order-form";
import { CommandSearch } from "./command-search";
import { RoleGate } from "./role-gate";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
  badge?: (d: ReturnType<typeof useData>) => { value: number; tone: "red" | "orange" | "muted" } | null;
}

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    badge: (d) => {
      const n = openBlockers(d).length;
      return n ? { value: n, tone: "red" } : null;
    },
  },
  { href: "/dashboard/briefings", label: "Daily Briefings", icon: Megaphone },
  {
    href: "/dashboard/work-orders",
    label: "Work Orders",
    icon: ClipboardList,
    badge: (d) => ({ value: d.workOrders.filter(isActive).length, tone: "muted" }),
  },
  { href: "/dashboard/production", label: "Production Board", icon: Columns3 },
  { href: "/dashboard/team", label: "Team", icon: Users, permission: "team.view" },
  {
    href: "/dashboard/messages",
    label: "Messages",
    icon: MessagesSquare,
    badge: (d) => {
      const n = totalUnread(d, currentEmployee(d));
      return n ? { value: n, tone: "orange" } : null;
    },
  },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3, permission: "reports.view" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, permission: "settings.view" },
];

const COLLAPSE_KEY = "bitco-workforce:sidebar-collapsed";
const collapseListeners = new Set<() => void>();
function readCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}
function writeCollapsed(v: boolean) {
  try {
    window.localStorage.setItem(COLLAPSE_KEY, v ? "1" : "0");
  } catch {
    /* ignore */
  }
  collapseListeners.forEach((l) => l());
}
function useCollapsed() {
  return useSyncExternalStore(
    (l) => {
      collapseListeners.add(l);
      return () => collapseListeners.delete(l);
    },
    readCollapsed,
    () => false,
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const data = useData();
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = useCollapsed();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const me = currentEmployee(data);
  const role = data.session.role;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items = NAV.filter((n) => !n.permission || can(role, n.permission));
  const isActiveRoute = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));

  const nav = (isCollapsed: boolean, onNavigate?: () => void) => (
    <nav className="flex flex-col gap-0.5 px-2.5" aria-label="Main">
      {items.map((item) => {
        const active = isActiveRoute(item.href);
        const badge = item.badge?.(data);
        const link = (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex h-10 items-center gap-3 rounded-md px-3 text-[0.9rem] font-medium transition-colors",
              active ? "bg-sidebar-accent text-white" : "text-sidebar-foreground/75 hover:bg-white/5 hover:text-white",
              isCollapsed && "justify-center px-0",
            )}
          >
            {active && <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-r bg-orange" aria-hidden />}
            <item.icon className={cn("size-[1.15rem] shrink-0", active ? "text-orange" : "text-sidebar-foreground/60 group-hover:text-white")} />
            {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
            {badge && badge.value > 0 && (
              <span
                className={cn(
                  "tabular inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[0.7rem] font-bold",
                  badge.tone === "red" && "bg-red-500 text-white",
                  badge.tone === "orange" && "bg-orange text-ink",
                  badge.tone === "muted" && "bg-white/10 text-white/70",
                  isCollapsed && "absolute top-1 right-1 h-4 min-w-4 px-1 text-[0.6rem]",
                )}
              >
                {badge.value}
              </span>
            )}
          </Link>
        );
        return isCollapsed ? (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ) : (
          link
        );
      })}
    </nav>
  );

  const userCard = (isCollapsed: boolean) => (
    <div className={cn("flex items-center gap-2.5 rounded-lg bg-white/5 p-2.5", isCollapsed && "justify-center p-1.5")}>
      <EmployeeAvatar employee={me} size="sm" />
      {!isCollapsed && (
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-semibold text-white">{fullName(me)}</div>
          <div className="truncate text-xs text-sidebar-foreground/60">{ROLE_LABEL[me.role]} · simulated</div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <DemoBar />
      <div className="flex min-h-0 flex-1">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "steel-texture hidden shrink-0 flex-col bg-sidebar transition-[width] duration-200 lg:flex",
            collapsed ? "w-[4.25rem]" : "w-64",
          )}
        >
          <div className={cn("flex h-16 items-center px-4", collapsed && "justify-center px-0")}>
            <Link href="/dashboard" aria-label="BITCO Workforce home">
              <WorkforceLogo compact={collapsed} />
            </Link>
          </div>
          <div className="mt-2 flex-1 overflow-y-auto">{nav(collapsed)}</div>
          <div className="space-y-2 p-2.5">
            {!collapsed && (
              <Link
                href="/worker"
                className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs text-sidebar-foreground/70 hover:border-white/25 hover:text-white"
              >
                <Smartphone className="size-4 text-cyan" /> Preview the worker app
              </Link>
            )}
            {userCard(collapsed)}
            <button
              onClick={() => writeCollapsed(!collapsed)}
              className="flex h-8 w-full items-center justify-center gap-2 rounded-md text-xs text-sidebar-foreground/60 hover:bg-white/5 hover:text-white"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronsRight className="size-4" /> : <><ChevronsLeft className="size-4" /> Collapse</>}
            </button>
          </div>
        </aside>

        {/* Mobile sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="steel-texture w-72 border-0 bg-sidebar p-0 text-sidebar-foreground" showCloseButton={false}>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex h-16 items-center px-4">
              <WorkforceLogo />
            </div>
            <div className="flex-1">{nav(false, () => setMobileOpen(false))}</div>
            <div className="p-2.5">{userCard(false)}</div>
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-white/80 px-4 backdrop-blur sm:px-6">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
              <Menu className="size-5" />
            </Button>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-9 w-full max-w-md items-center gap-2 rounded-md border bg-steel-50 px-3 text-sm text-muted-foreground transition hover:border-steel-300"
            >
              <Search className="size-4" />
              <span className="flex-1 truncate text-left">Search jobs, customers, people…</span>
              <kbd className="hidden rounded border bg-white px-1.5 font-mono text-[0.65rem] sm:inline">⌘K</kbd>
            </button>
            <div className="ml-auto flex items-center gap-2">
              {can(role, "workOrder.create") && (
                <Button variant="brand" onClick={() => setCreateOpen(true)} className="h-9">
                  <Plus className="size-4" /> <span className="hidden sm:inline">New work order</span>
                </Button>
              )}
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto">
            <RoleGate allow={["admin", "supervisor"]}>{children}</RoleGate>
          </main>
        </div>
      </div>

      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <WorkOrderFormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={(id) => router.push(`/dashboard/work-orders/${id}`)}
      />
    </div>
  );
}
