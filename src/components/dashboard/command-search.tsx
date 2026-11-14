"use client";

import { useRouter } from "next/navigation";
import { ClipboardList, LayoutDashboard, User } from "lucide-react";
import { useData } from "@/lib/store/app-store";
import { customerName, fullName } from "@/lib/selectors";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { StatusBadge } from "@/components/shared/badges";

const PAGES = [
  ["Overview", "/dashboard"],
  ["Daily Briefings", "/dashboard/briefings"],
  ["Create today's briefing", "/dashboard/briefings/new"],
  ["Work Orders", "/dashboard/work-orders"],
  ["Production Board", "/dashboard/production"],
  ["Team", "/dashboard/team"],
  ["Messages", "/dashboard/messages"],
  ["Reports", "/dashboard/reports"],
  ["Settings", "/dashboard/settings"],
] as const;

export function CommandSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const data = useData();
  const router = useRouter();
  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search" description="Search jobs, customers and people">
      <CommandInput placeholder="Search WO number, job, customer or person…" />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>
        <CommandGroup heading="Work orders">
          {[...data.workOrders].reverse().map((w) => (
            <CommandItem
              key={w.id}
              value={`${w.number} ${w.title} ${customerName(data, w.customerId)}`}
              onSelect={() => go(`/dashboard/work-orders/${w.id}`)}
            >
              <ClipboardList />
              <span className="font-mono text-xs font-semibold text-ocean">{w.number}</span>
              <span className="flex-1 truncate">{w.title}</span>
              <StatusBadge status={w.status} />
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="People">
          {data.employees.map((e) => (
            <CommandItem key={e.id} value={`${fullName(e)} ${e.position}`} onSelect={() => go(`/dashboard/team/${e.id}`)}>
              <User />
              {fullName(e)}
              <span className="text-xs text-muted-foreground">{e.position}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Pages">
          {PAGES.map(([label, href]) => (
            <CommandItem key={href} value={`page ${label}`} onSelect={() => go(href)}>
              <LayoutDashboard />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
