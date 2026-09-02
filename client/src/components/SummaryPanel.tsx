import type { PensumSummary } from "@epensum/shared";
import { Card, CardContent } from "@/components/ui/card";
import { DonutStat } from "@/components/DonutStat";
import { HonorBadge } from "@/components/HonorBadge";

export function SummaryPanel({ summary }: { summary: PensumSummary }) {
  return (
    <Card className="rounded-2xl border-border shadow-sm">
      <CardContent className="flex flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{summary.careerName}</h1>
            <p className="text-sm text-muted-foreground">{summary.totalCredits} créditos en total</p>
          </div>
          {summary.honor && <HonorBadge honor={summary.honor} />}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <DonutStat
            label="Créditos"
            approvedLabel="Aprobados"
            pendingLabel="Pendientes"
            approved={summary.creditsApproved}
            pending={summary.creditsPending}
            approvedPct={summary.creditsApprovedPct}
          />
          <DonutStat
            label="Asignaturas"
            approvedLabel="Aprobadas"
            pendingLabel="Pendientes"
            approved={summary.subjectsApproved}
            pending={summary.subjectsPending}
            approvedPct={summary.subjectsApprovedPct}
          />
        </div>

        {summary.weightedIndex !== null && (
          <p className="text-sm text-muted-foreground">
            Índice académico:{" "}
            <span className="font-medium text-foreground">{summary.weightedIndex.toFixed(1)}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
