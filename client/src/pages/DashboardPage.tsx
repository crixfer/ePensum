import { Navigate } from "react-router-dom";
import { usePensum } from "@/hooks/usePensum";
import { ApiError } from "@/lib/api";
import { SummaryPanel } from "@/components/SummaryPanel";
import { QuarterAccordion } from "@/components/QuarterAccordion";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardPage() {
  const { data, isLoading, error } = usePensum();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  }

  if (error instanceof ApiError && error.status === 404) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!data) {
    return <p className="text-sm text-destructive">No se pudo cargar tu pensum. Intenta de nuevo más tarde.</p>;
  }

  return (
    <div className="space-y-6">
      <SummaryPanel summary={data.summary} />
      <QuarterAccordion quarters={data.quarters} extraField={data.summary.extraField} />
    </div>
  );
}
