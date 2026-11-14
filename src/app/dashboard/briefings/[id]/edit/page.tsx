"use client";

import { useParams } from "next/navigation";
import { Megaphone } from "lucide-react";
import { can } from "@/lib/auth/permissions";
import { useData } from "@/lib/store/app-store";
import { BriefingEditor } from "@/components/briefings/briefing-editor";
import { NoAccess } from "@/components/dashboard/no-access";
import { EmptyState } from "@/components/shared/empty-state";

export default function EditBriefingPage() {
  const { id } = useParams<{ id: string }>();
  const data = useData();
  const b = data.briefings.find((x) => x.id === id);
  if (!can(data.session.role, "briefing.manage")) return <NoAccess what="edit briefings" />;
  if (!b) return <div className="p-6"><EmptyState icon={Megaphone} title="Briefing not found" /></div>;
  return <BriefingEditor briefing={b} />;
}
