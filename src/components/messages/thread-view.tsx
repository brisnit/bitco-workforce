"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ClipboardList, ImagePlus, Info, Send, X } from "lucide-react";
import { can } from "@/lib/auth/permissions";
import type { AppData, Employee } from "@/lib/domain/types";
import { formatLongDay, formatTime, toDateKey } from "@/lib/dates";
import { actions } from "@/lib/store/app-store";
import { employeeById, fullName, threadMessages, threadTitle, workOrderById } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmployeeAvatar } from "@/components/shared/employee-avatar";
import { PhotoInput, type PickedPhoto } from "@/components/shared/photo-input";
import { StatusBadge } from "@/components/shared/badges";
import { ThreadIcon } from "./thread-list";

export function ThreadView({
  data,
  viewer,
  threadId,
  variant = "desktop",
  onBack,
  workOrderHref,
}: {
  data: AppData;
  viewer: Employee;
  threadId: string;
  variant?: "desktop" | "mobile";
  onBack?: () => void;
  workOrderHref: (id: string) => string;
}) {
  const thread = data.threads.find((t) => t.id === threadId);
  const msgs = threadMessages(data, threadId);
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [showPhoto, setShowPhoto] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const mobile = variant === "mobile";

  useEffect(() => {
    actions.markThreadRead(threadId);
    endRef.current?.scrollIntoView({ block: "end" });
  }, [threadId, msgs.length]);

  if (!thread) return null;
  const wo = workOrderById(data, thread.workOrderId);
  const canPost = thread.kind !== "announcement" || can(viewer.role, "announcement.send");
  const participants = thread.kind === "announcement" ? "Everyone at the shop" : thread.participantIds.map((p) => employeeById(data, p)?.firstName).filter(Boolean).join(", ");

  function send(e?: React.FormEvent) {
    e?.preventDefault();
    const attachmentIds: string[] = [];
    if (photo) {
      const id = actions.addAttachment({ url: photo.url, name: photo.name, caption: "Shared in messages" });
      if (id) attachmentIds.push(id);
    }
    const ok = actions.sendMessage(threadId, { body, attachmentIds });
    if (ok) {
      setBody("");
      setPhoto(null);
      setShowPhoto(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className={cn("flex shrink-0 items-center gap-3 border-b bg-white px-4", mobile ? "h-16" : "h-[4.25rem]")}>
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to conversations" className={cn(mobile && "size-11")}>
            <ArrowLeft className="size-5" />
          </Button>
        )}
        <ThreadIcon data={data} thread={thread} viewer={viewer} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display font-bold text-navy">{threadTitle(data, thread, viewer.id)}</p>
          <p className="truncate text-xs text-muted-foreground">{participants}</p>
        </div>
        {wo && (
          <Link href={workOrderHref(wo.id)} className="hidden items-center gap-2 rounded-md border px-2 py-1 hover:bg-steel-50 sm:flex">
            <span className="font-mono text-xs font-bold text-ocean">{wo.number}</span>
            <StatusBadge status={wo.status} />
          </Link>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#f3f2ee] px-4 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {msgs.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No messages yet. Say hello.</p>}
          {msgs.map((m, i) => {
            const mine = m.senderId === viewer.id;
            const sender = employeeById(data, m.senderId);
            const showDay = i === 0 || toDateKey(m.createdAt) !== toDateKey(msgs[i - 1].createdAt);
            const ref = m.workOrderId && m.workOrderId !== thread.workOrderId ? workOrderById(data, m.workOrderId) : undefined;
            const imgs = (m.attachmentIds ?? []).map((id) => data.attachments.find((a) => a.id === id)).filter(Boolean);
            return (
              <div key={m.id}>
                {showDay && (
                  <div className="my-3 flex items-center gap-3 text-[0.7rem] font-semibold tracking-wide text-steel-500 uppercase">
                    <span className="h-px flex-1 bg-steel-200" />
                    {formatLongDay(m.createdAt)}
                    <span className="h-px flex-1 bg-steel-200" />
                  </div>
                )}
                <div className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
                  {!mine && <EmployeeAvatar employee={sender} size="sm" />}
                  <div className={cn("max-w-[80%] space-y-1", mine && "items-end text-right")}>
                    <div className={cn("flex items-baseline gap-2 text-xs", mine && "justify-end")}>
                      <span className="font-semibold text-navy">{mine ? "You" : sender ? fullName(sender) : "Unknown"}</span>
                      <span className="text-muted-foreground">{formatTime(m.createdAt)}</span>
                    </div>
                    <div
                      className={cn(
                        "inline-block rounded-2xl px-3.5 py-2 text-left whitespace-pre-line shadow-sm",
                        mobile ? "text-base" : "text-sm",
                        mine ? "rounded-br-sm bg-navy text-white" : "rounded-bl-sm bg-white text-ink",
                      )}
                    >
                      {m.body}
                      {imgs.map((a) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={a!.id} src={a!.url} alt={a!.name} className="mt-2 max-h-56 rounded-lg" />
                      ))}
                    </div>
                    {ref && (
                      <Link
                        href={workOrderHref(ref.id)}
                        className={cn("flex w-fit items-center gap-1.5 rounded-md border bg-white px-2 py-1 text-xs hover:bg-steel-50", mine && "ml-auto")}
                      >
                        <ClipboardList className="size-3.5 text-ocean" />
                        <span className="font-mono font-bold text-ocean">{ref.number}</span>
                        <span className="max-w-[12rem] truncate text-steel-600">{ref.title}</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </div>

      <div className={cn("shrink-0 border-t bg-white p-3", mobile && "pb-4")}>
        {canPost ? (
          <form onSubmit={send} className="mx-auto max-w-3xl space-y-2">
            {showPhoto && (
              <div className="flex items-start gap-2">
                <PhotoInput value={photo} onChange={setPhoto} />
                <Button type="button" variant="ghost" size="icon" onClick={() => { setShowPhoto(false); setPhoto(null); }} aria-label="Cancel photo">
                  <X className="size-4" />
                </Button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("shrink-0 text-steel-500", mobile && "size-12")}
                onClick={() => setShowPhoto((s) => !s)}
                aria-label="Attach photo"
              >
                <ImagePlus className="size-5" />
              </Button>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !mobile) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder={thread.kind === "announcement" ? "Post an announcement to the whole shop…" : "Type a message…"}
                className={cn("max-h-32 min-h-10 resize-none bg-steel-50", mobile && "min-h-12 text-base")}
                aria-label="Message"
              />
              <Button type="submit" variant="brand" size="icon" className={cn("shrink-0", mobile ? "size-12" : "size-10")} disabled={!body.trim() && !photo} aria-label="Send">
                <Send className="size-5" />
              </Button>
            </div>
            <p className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
              <Info className="size-3" /> Demo: messages are saved in this browser only and are not delivered to anyone.
            </p>
          </form>
        ) : (
          <p className="text-center text-sm text-muted-foreground">Only supervisors and the office can post shop announcements.</p>
        )}
      </div>
    </div>
  );
}
