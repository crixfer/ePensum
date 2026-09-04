import { useState } from "react";
import { SUBJECT_STATUSES, STATUS_LABELS_ES, type ExtraFieldType, type SubjectView } from "@epensum/shared";
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

export function SubjectRow({ subject, extraField }: { subject: SubjectView; extraField: ExtraFieldType }) {
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
    <div className="grid grid-cols-1 gap-3 border-b border-border py-3 last:border-b-0 sm:grid-cols-[auto_1fr_auto_auto_auto_auto] sm:items-center sm:gap-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-end gap-2 sm:flex sm:items-center sm:gap-1 sm:order-1">
        {extraField === "orden" ? (
          <div className="min-w-0 sm:contents">
            <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">N°</span>
            <span className="text-sm text-muted-foreground sm:w-6">{subject.order}</span>
          </div>
        ) : (
          <div className="min-w-0 sm:contents">
            <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">Fecha</span>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onBlur={commitDate}
              className="w-full text-muted-foreground/60 sm:w-36"
            />
          </div>
        )}

        <div className="text-center sm:contents">
          <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">CR</span>
          <span className="text-sm text-muted-foreground sm:w-6 sm:text-center">{subject.credits}</span>
        </div>

        <div className="text-center sm:contents">
          <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">HT</span>
          <span className="text-sm text-muted-foreground sm:w-6 sm:text-center">{subject.totalHours ?? "—"}</span>
        </div>
      </div>

      <p className="text-sm font-medium text-foreground sm:order-2">{subject.name}</p>

      <span className="text-xs text-muted-foreground sm:order-3 sm:w-40 sm:text-center">
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
          className="w-full sm:order-4 sm:w-36"
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
            <SelectItem key={status} value={status}>
              {STATUS_LABELS_ES[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2 sm:order-5 sm:w-20">
        <Input
          type="number"
          min={0}
          max={100}
          placeholder="0"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          onBlur={commitScore}
          className="w-14"
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
        className="w-full placeholder:text-muted-foreground/60 sm:order-6 sm:w-40"
      />
    </div>
  );
}
