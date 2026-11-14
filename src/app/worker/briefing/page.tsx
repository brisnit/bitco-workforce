"use client";

import Link from "next/link";
import { ArrowLeft, Megaphone } from "lucide-react";
import { useData } from "@/lib/store/app-store";
import { currentEmployee, todaysBriefing } from "@/lib/selectors";
import { EmptyState } from "@/components/shared/empty-state";
import { WorkerBriefingCard } from "@/components/worker/briefing-card";

export default function WorkerBriefingPage() {
  const data = useData();
  const me = currentEmployee(data);
  const b = todaysBriefing(data, me);
  const ack = b && data.acknowledgements.find((a) => a.briefingId === b.id && a.employeeId === me.id);
  return (
    <div className="space-y-4 p-4">
      <Link href="/worker" className="inline-flex h-11 items-center gap-2 text-base font-semibold text-navy">
        <ArrowLeft className="size-5" /> Today
      </Link>
      {b ? <WorkerBriefingCard data={data} briefing={b} ackAt={ack?.acknowledgedAt} full /> : <EmptyState icon={Megaphone} title="No briefing yet" />}
    </div>
  );
}
