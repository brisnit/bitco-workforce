"use client";

import { Loader2 } from "lucide-react";
import { useAppData } from "@/lib/store/app-store";

/** Renders children only once browser-stored demo data is available. */
export function DataGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const data = useAppData();
  if (!data) return <>{fallback ?? <LoadingScreen />}</>;
  return <>{children}</>;
}

export function LoadingScreen({ label = "Loading shop data…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-3 text-steel-500" role="status">
      <Loader2 className="size-6 animate-spin text-orange" />
      <span className="eyebrow">{label}</span>
    </div>
  );
}
