"use client";

import { Suspense } from "react";
import { MessagesView } from "@/components/messages/messages-view";
import { LoadingScreen } from "@/components/shared/data-gate";

export default function MessagesPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <MessagesView />
    </Suspense>
  );
}
