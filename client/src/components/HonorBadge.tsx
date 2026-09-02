import { GraduationCap } from "lucide-react";
import type { HonorClassification } from "@epensum/shared";

export function HonorBadge({ honor }: { honor: HonorClassification }) {
  if (!honor) return null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-honor-bg px-4 py-2 text-sm font-medium text-honor">
      <GraduationCap className="size-4" />
      {honor}
    </div>
  );
}
