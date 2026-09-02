import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
  SUBJECT_STATUSES,
  STATUS_LABELS_ES,
  type ParsedPensum,
  type ParsedSubject,
} from "@epensum/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ImportReviewTableProps {
  parsed: ParsedPensum;
  onConfirm: (payload: { careerName: string; quarters: { order: number; name: string; subjects: ParsedSubject[] }[] }) => void;
  isSubmitting: boolean;
}

export function ImportReviewTable({ parsed, onConfirm, isSubmitting }: ImportReviewTableProps) {
  const [careerName, setCareerName] = useState(parsed.careerName);
  const [quarters, setQuarters] = useState(parsed.quarters);

  function updateSubject(quarterIdx: number, subjectIdx: number, patch: Partial<ParsedSubject>) {
    setQuarters((prev) =>
      prev.map((q, qi) =>
        qi !== quarterIdx
          ? q
          : { ...q, subjects: q.subjects.map((s, si) => (si === subjectIdx ? { ...s, ...patch } : s)) },
      ),
    );
  }

  function removeSubject(quarterIdx: number, subjectIdx: number) {
    setQuarters((prev) =>
      prev.map((q, qi) => (qi !== quarterIdx ? q : { ...q, subjects: q.subjects.filter((_, si) => si !== subjectIdx) })),
    );
  }

  function hasWarning(code: string) {
    return parsed.warnings.some((w) => w.includes(code));
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="career-name">Nombre de la carrera</Label>
        <Input id="career-name" value={careerName} onChange={(e) => setCareerName(e.target.value)} />
      </div>

      {parsed.warnings.length > 0 && (
        <div className="space-y-1 rounded-xl border border-amber-300 bg-status-en-curso-bg p-4 text-sm text-status-en-curso">
          <p className="flex items-center gap-2 font-medium">
            <AlertTriangle className="size-4" /> Revisa estos datos antes de continuar
          </p>
          <ul className="list-inside list-disc space-y-0.5">
            {parsed.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        {quarters.map((quarter, qi) => (
          <div key={qi} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-medium text-foreground">{quarter.name}</h3>
            <div className="space-y-2">
              {quarter.subjects.map((subject, si) => (
                <div
                  key={si}
                  className={cn(
                    "grid grid-cols-1 items-center gap-2 rounded-lg p-2 sm:grid-cols-[1fr_auto_auto_auto_auto]",
                    hasWarning(subject.code) && "border border-amber-300 bg-status-en-curso-bg",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{subject.code}</span>
                    <Input
                      value={subject.name}
                      onChange={(e) => updateSubject(qi, si, { name: e.target.value })}
                      className="h-8"
                    />
                  </div>
                  <Select
                    value={subject.status}
                    onValueChange={(value) => updateSubject(qi, si, { status: value as ParsedSubject["status"] })}
                  >
                    <SelectTrigger size="sm" className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {STATUS_LABELS_ES[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Nota"
                    value={subject.finalScore ?? ""}
                    onChange={(e) =>
                      updateSubject(qi, si, { finalScore: e.target.value === "" ? null : Number(e.target.value) })
                    }
                    className="h-8 w-20"
                  />
                  <Input
                    type="date"
                    value={subject.completedDate?.slice(0, 10) ?? ""}
                    onChange={(e) => updateSubject(qi, si, { completedDate: e.target.value || null })}
                    className="h-8 w-36"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeSubject(qi, si)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={() => onConfirm({ careerName, quarters })}
        disabled={isSubmitting}
        className="w-full sm:w-auto"
      >
        {isSubmitting ? "Guardando…" : "Confirmar e importar"}
      </Button>
    </div>
  );
}
