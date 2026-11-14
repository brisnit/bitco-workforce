"use client";

import { ClipboardList, Megaphone, UsersRound } from "lucide-react";
import type { AppData, Employee, MessageThread } from "@/lib/domain/types";
import { formatRelative } from "@/lib/dates";
import { employeeById, lastMessage, threadTitle, unreadCount, visibleThreads } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { EmployeeAvatar } from "@/components/shared/employee-avatar";

export function ThreadIcon({ data, thread, viewer, size = "md" }: { data: AppData; thread: MessageThread; viewer: Employee; size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-12" : "size-10";
  if (thread.kind === "direct") {
    const other = employeeById(data, thread.participantIds.find((p) => p !== viewer.id));
    return <EmployeeAvatar employee={other} size={size === "lg" ? "lg" : "md"} className={size === "lg" ? "size-12" : undefined} />;
  }
  const Icon = thread.kind === "announcement" ? Megaphone : thread.kind === "work_order" ? ClipboardList : UsersRound;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        box,
        thread.kind === "announcement" ? "bg-orange text-ink" : thread.kind === "work_order" ? "bg-navy text-cyan" : "bg-ocean text-white",
      )}
    >
      <Icon className="size-5" />
    </span>
  );
}

export function ThreadList({
  data,
  viewer,
  activeId,
  onSelect,
  large = false,
}: {
  data: AppData;
  viewer: Employee;
  activeId?: string | null;
  onSelect: (id: string) => void;
  large?: boolean;
}) {
  const threads = visibleThreads(data, viewer);
  return (
    <ul className="divide-y">
      {threads.map((t) => {
        const last = lastMessage(data, t.id);
        const unread = unreadCount(data, viewer.id, t.id);
        const sender = last ? employeeById(data, last.senderId) : undefined;
        return (
          <li key={t.id}>
            <button
              onClick={() => onSelect(t.id)}
              className={cn(
                "flex w-full items-center gap-3 px-4 text-left transition hover:bg-steel-50",
                large ? "py-4" : "py-3",
                activeId === t.id && "bg-steel-100 hover:bg-steel-100",
              )}
            >
              <ThreadIcon data={data} thread={t} viewer={viewer} size={large ? "lg" : "md"} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className={cn("truncate text-navy", large ? "text-base" : "text-sm", unread ? "font-bold" : "font-semibold")}>
                    {threadTitle(data, t, viewer.id)}
                  </span>
                  {last && <span className="ml-auto shrink-0 text-xs text-muted-foreground">{formatRelative(last.createdAt)}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <p className={cn("truncate", large ? "text-[0.95rem]" : "text-sm", unread ? "text-ink" : "text-muted-foreground")}>
                    {last ? `${sender?.id === viewer.id ? "You" : sender?.firstName ?? "Someone"}: ${last.body || "Photo"}` : "No messages yet"}
                  </p>
                  {unread > 0 && (
                    <span className="tabular ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-orange px-1.5 text-xs font-bold text-ink">
                      {unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
