"use client";

import { can } from "@/lib/auth/permissions";
import { useData } from "@/lib/store/app-store";
import { BriefingEditor } from "@/components/briefings/briefing-editor";
import { NoAccess } from "@/components/dashboard/no-access";

export default function NewBriefingPage() {
  const data = useData();
  if (!can(data.session.role, "briefing.manage")) return <NoAccess what="create briefings" />;
  return <BriefingEditor />;
}
