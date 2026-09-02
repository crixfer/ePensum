import type { PensumSummary } from "@epensum/shared";
import { Card, CardContent } from "@/components/ui/card";
import { DonutStat } from "@/components/DonutStat";
import { HonorBadge } from "@/components/HonorBadge";
import unicaribeEmblem from "@/assets/unicaribe-emblem.png";

export function SummaryPanel({ summary }: { summary: PensumSummary }) {
  return (
    <Card className="rounded-2xl border-border shadow-sm">
      <CardContent className="flex flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {summary.universityName && (
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {summary.universityId === "unicaribe" && (
                  <img src={unicaribeEmblem} alt="" className="h-4 w-4" />
                )}
                {summary.universityName}
              </p>
            )}
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{summary.careerName}</h1>
            <p className="text-sm text-muted-foreground">{summary.totalCredits} créditos en total</p>
          </div>
          {summary.honor ? (
            <HonorBadge honor={summary.honor} />
          ) : (
            <span className="text-sm font-medium text-muted-foreground">Sin Honor</span>
          )}
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
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
          <div className="sm:text-right">
            <span className="text-4xl font-semibold tracking-tight text-foreground">
              {summary.weightedIndex !== null ? summary.weightedIndex.toFixed(1) : "00.0"}
            </span>
            <p className="text-sm text-muted-foreground">Índice académico</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
