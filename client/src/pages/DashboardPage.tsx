import { Navigate } from "react-router-dom";
import { usePensum } from "@/hooks/usePensum";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { SummaryPanel } from "@/components/SummaryPanel";
import { QuarterAccordion } from "@/components/QuarterAccordion";
import { GraduationCard } from "@/components/GraduationCard";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardPage() {
  const { data, isLoading, error } = usePensum();
  const { user } = useAuth();

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

  const isPensumCompleted = data.quarters.length > 0 && data.quarters.every((q) => q.status === "COMPLETADO");

  return (
    <div className="space-y-6">
      <SummaryPanel summary={data.summary} />
      <QuarterAccordion quarters={data.quarters} extraField={data.summary.extraField} />
      {isPensumCompleted && user && <GraduationCard name={user.name} careerName={data.summary.careerName} />}
    </div>
  );
}
