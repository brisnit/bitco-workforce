"use client";

import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import type { Role } from "@/lib/domain/types";
import { ROLE_LABEL } from "@/lib/domain/constants";
import { actions, useData } from "@/lib/store/app-store";
import { currentEmployee } from "@/lib/selectors";
import { Button } from "@/components/ui/button";

/**
 * UI-only gate for the simulated role. Not a security boundary — real
 * authorization must be enforced server-side once auth exists.
 */
export function RoleGate({ allow, children }: { allow: Role[]; children: React.ReactNode }) {
  const data = useData();
  const router = useRouter();
  const me = currentEmployee(data);
  if (allow.includes(data.session.role)) return <>{children}</>;

  const isWorkerArea = allow.includes("worker");
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-navy text-orange">
          <Lock className="size-5" />
        </div>
        <h2 className="font-display text-xl font-extrabold text-navy">
          {isWorkerArea ? "This is the shop worker app" : "This is the office & supervisor dashboard"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You&apos;re viewing the demo as <strong>{me.firstName}</strong> ({ROLE_LABEL[me.role]}). Switch the simulated role to
          see this area.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {isWorkerArea ? (
            <Button variant="brand" onClick={() => actions.switchUser("emp-marcus")}>
              View as Marcus (worker)
            </Button>
          ) : (
            <Button variant="brand" onClick={() => actions.switchUser("emp-eran")}>
              View as Eran (owner)
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push(isWorkerArea ? "/dashboard" : "/worker")}>
            {isWorkerArea ? "Go to dashboard" : "Go to worker app"}
          </Button>
        </div>
      </div>
    </div>
  );
}
