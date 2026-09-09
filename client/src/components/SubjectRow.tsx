import { useState } from "react";
import { SUBJECT_STATUSES, STATUS_LABELS_ES, type ExtraFieldType, type SubjectStatus, type SubjectView } from "@epensum/shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useUpdateSubject } from "@/hooks/usePensum";
import { cn } from "@/lib/utils";

const LETTER_STYLES: Record<string, string> = {
  A: "text-status-completado",
  B: "text-status-inscrita",
  C: "text-status-en-curso",
  D: "text-status-en-curso",
  F: "text-destructive",
};

const STATUS_OPTION_STYLES: Record<SubjectStatus, string> = {
  PENDIENTE: "",
  INSCRITA: "text-dropdown-inscrita",
  EN_CURSO: "text-dropdown-en-curso",
  COMPLETADO: "text-dropdown-completado",
};

export function SubjectRow({
  subject,
  extraField,
  showTotalHours,
}: {
  subject: SubjectView;
  extraField: ExtraFieldType;
  showTotalHours: boolean;
}) {
  const update = useUpdateSubject();
  const [score, setScore] = useState(subject.finalScore?.toString() ?? "");
  const [teacher, setTeacher] = useState(subject.teacher ?? "");
  const [date, setDate] = useState(subject.completedDate?.slice(0, 10) ?? "");

  function commitScore() {
    const parsed = score === "" ? null : Number(score);
    if (parsed !== subject.finalScore) {
      update.mutate({ subjectId: subject.id, update: { finalScore: parsed } });
    }
  }

  function commitTeacher() {
    const value = teacher.trim() || null;
    if (value !== subject.teacher) {
      update.mutate({ subjectId: subject.id, update: { teacher: value } });
    }
  }

  function commitDate() {
    const value = date || null;
    if (value !== (subject.completedDate?.slice(0, 10) ?? null)) {
      update.mutate({ subjectId: subject.id, update: { completedDate: value } });
    }
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 border-b border-border py-3 last:border-b-0 lg:items-center lg:gap-4",
        "lg:grid-cols-[auto_1fr_auto_auto_auto_auto]",
        extraField === "fecha" && "max-lg:grid-cols-[minmax(0,1fr)_auto]",
      )}
    >
      <div
        className={cn(
          "grid grid-cols-[minmax(0,1fr)_auto_auto] items-end gap-2 lg:order-1 lg:flex lg:items-center lg:gap-1",
          "order-2 lg:order-1",
          extraField === "fecha" && "max-lg:col-span-1",
        )}
      >
        {extraField === "orden" ? (
          <div className="min-w-0 lg:contents">
            <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground lg:hidden">N°</span>
            <span className="text-sm text-muted-foreground lg:w-6">{subject.order}</span>
          </div>
        ) : (
          <div className="min-w-0 lg:contents">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onBlur={commitDate}
              className="w-full text-muted-foreground/60 lg:w-36"
            />
          </div>
        )}

        <div className="text-center max-lg:hidden lg:contents">
          <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground lg:hidden">CR</span>
          <span className="text-sm text-muted-foreground lg:w-6 lg:text-center">{subject.credits}</span>
        </div>

        {showTotalHours && (
          <div className="text-center max-lg:hidden lg:contents">
            <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground lg:hidden">HT</span>
            <span className="text-sm text-muted-foreground lg:w-6 lg:text-center">{subject.totalHours ?? "—"}</span>
          </div>
        )}
      </div>

      <p className="order-first text-sm font-semibold text-primary max-lg:col-span-2 lg:order-2">{subject.name}</p>

      <div className="order-1 col-span-2 flex items-center gap-2 text-xs text-muted-foreground lg:hidden">
        <span className="font-mono">{subject.code}</span>
        <span aria-hidden="true">·</span>
        <span>CR {subject.credits}</span>
      </div>

      <span className="text-xs text-muted-foreground max-lg:hidden lg:order-3 lg:w-40 lg:text-center">
        <span className="font-mono">{subject.code}</span>
        {subject.prerequisiteCode && (
          <>
            {" · "}
            <span className="font-mono">{subject.prerequisiteCode}</span>
          </>
        )}
      </span>

      <Select
        value={subject.status}
        onValueChange={(value) => update.mutate({ subjectId: subject.id, update: { status: value } })}
        disabled={!subject.prerequisiteMet}
      >
        <SelectTrigger
          size="sm"
          className={cn(
            "order-4 max-lg:col-span-2 w-full lg:order-4 lg:w-36",
            STATUS_OPTION_STYLES[subject.status],
          )}
          title={
            subject.prerequisiteMet
              ? undefined
              : `Completa primero ${subject.prerequisiteCode} para poder cambiar el estatus.`
          }
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SUBJECT_STATUSES.map((status) => (
            <SelectItem key={status} value={status} className={STATUS_OPTION_STYLES[status]}>
              {STATUS_LABELS_ES[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="order-3 flex items-center justify-self-end gap-2 lg:order-5 lg:w-20 lg:justify-center lg:justify-self-auto">
        <Input
          type="number"
          min={0}
          max={100}
          placeholder="0"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          onBlur={commitScore}
          className="no-number-spinner w-14 text-center"
        />
        <span
          className={cn(
            "w-4 text-sm font-semibold",
            subject.letterGrade ? LETTER_STYLES[subject.letterGrade] : "text-muted-foreground",
          )}
        >
          {subject.letterGrade ?? "S"}
        </span>
      </div>

      <Input
        placeholder="Nombre del Docente"
        value={teacher}
        onChange={(e) => setTeacher(e.target.value)}
        onBlur={commitTeacher}
        className="order-5 max-lg:col-span-2 w-full justify-self-end placeholder:text-muted-foreground/60 lg:order-6 lg:w-40 lg:justify-self-auto"
      />
    </div>
  );
}
