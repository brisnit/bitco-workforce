"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { MessagesSquare, PenSquare } from "lucide-react";
import { useData } from "@/lib/store/app-store";
import { currentEmployee, visibleThreads } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ThreadList } from "./thread-list";
import { ThreadView } from "./thread-view";
import { NewMessageDialog } from "./new-message-dialog";

/** Two-pane messaging for the office/supervisor dashboard. */
export function MessagesView() {
  const data = useData();
  const viewer = currentEmployee(data);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [newOpen, setNewOpen] = useState(false);
  const threads = visibleThreads(data, viewer);
  const requested = params.get("thread");
  const activeId = requested && threads.some((t) => t.id === requested) ? requested : null;
  const select = (id: string | null) => router.replace(id ? `${pathname}?thread=${id}` : pathname, { scroll: false });

  return (
    <div className="flex h-full min-h-0">
      <aside className={cn("flex w-full shrink-0 flex-col border-r bg-white md:w-80 lg:w-96", activeId && "hidden md:flex")}>
        <div className="flex h-[4.25rem] items-center justify-between border-b px-4">
          <div>
            <h1 className="font-display text-lg font-extrabold text-navy">Messages</h1>
            <p className="text-xs text-muted-foreground">{threads.length} conversations</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setNewOpen(true)}>
            <PenSquare className="size-3.5" /> New
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ThreadList data={data} viewer={viewer} activeId={activeId} onSelect={select} />
        </div>
      </aside>
      <section className={cn("min-w-0 flex-1", !activeId && "hidden md:block")}>
        {activeId ? (
          <ThreadView
            key={activeId}
            data={data}
            viewer={viewer}
            threadId={activeId}
            onBack={() => select(null)}
            workOrderHref={(id) => `/dashboard/work-orders/${id}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6">
            <EmptyState icon={MessagesSquare} title="Pick a conversation" description="Direct messages, job threads and shop announcements all live here." className="max-w-md" />
          </div>
        )}
      </section>
      <NewMessageDialog data={data} viewer={viewer} open={newOpen} onOpenChange={setNewOpen} onOpened={select} />
    </div>
  );
}
