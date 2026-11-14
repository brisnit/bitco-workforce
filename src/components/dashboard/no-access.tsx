import { Lock } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export function NoAccess({ what }: { what: string }) {
  return (
    <div className="p-6">
      <EmptyState
        icon={Lock}
        title="Not available for this demo role"
        description={`Your simulated role can't ${what}. Switch to Eran (Owner) from the demo bar to try it.`}
      />
    </div>
  );
}
