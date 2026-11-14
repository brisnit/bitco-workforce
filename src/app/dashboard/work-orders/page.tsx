"use client";

import { Suspense } from "react";
import { WorkOrdersView } from "@/components/work-orders/work-orders-view";
import { LoadingScreen } from "@/components/shared/data-gate";

export default function WorkOrdersPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <WorkOrdersView />
    </Suspense>
  );
}
