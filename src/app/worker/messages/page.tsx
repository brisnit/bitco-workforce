"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { PenSquare } from "lucide-react";
import { useData } from "@/lib/store/app-store";
import { currentEmployee, visibleThreads } from "@/lib/selectors";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/shared/data-gate";
import { ThreadList } from "@/components/messages/thread-list";
import { ThreadView } from "@/components/messages/thread-view";
import { NewMessageDialog } from "@/components/messages/new-message-dialog";

export default function WorkerMessagesPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <WorkerMessages />
    </Suspense>
  );
}

function WorkerMessages() {
  const data = useData();
  const me = currentEmployee(data);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [newOpen, setNewOpen] = useState(false);
  const tid = params.get("thread");
  const active = tid && visibleThreads(data, me).some((t) => t.id === tid) ? tid : null;
  const select = (id: string | null) => router.replace(id ? `${pathname}?thread=${id}` : pathname, { scroll: false });

  if (active) {
    return <ThreadView key={active} data={data} viewer={me} threadId={active} variant="mobile" onBack={() => select(null)} workOrderHref={(id) => `/worker/jobs/${id}`} />;
  }
  return (
    <div>
      <div className="flex items-center justify-between p-4">
        <h1 className="font-display text-3xl font-black tracking-tight text-navy uppercase">Messages</h1>
        <Button variant="outline" className="h-11" onClick={() => setNewOpen(true)}>
          <PenSquare className="size-5" /> New
        </Button>
      </div>
      <div className="border-t bg-white">
        <ThreadList data={data} viewer={me} onSelect={select} large />
      </div>
      <p className="p-4 text-center text-xs text-muted-foreground">Demo: messages stay in this browser and are not delivered to anyone.</p>
      <NewMessageDialog data={data} viewer={me} open={newOpen} onOpenChange={setNewOpen} onOpened={select} />
    </div>
  );
}
