import { useState } from "react";
import { SUBJECT_STATUSES, STATUS_LABELS_ES, type SubjectView } from "@epensum/shared";
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

export function SubjectRow({ subject }: { subject: SubjectView }) {
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
      <div className="flex items-baseline gap-2 sm:contents">
        <span className="font-mono text-xs text-muted-foreground">{subject.code}</span>
        <p className="text-sm font-medium text-foreground">{subject.name}</p>
      </div>

      <span className="text-xs text-muted-foreground sm:text-center">{subject.credits} créd.</span>

      <Select
        value={subject.status}
        onValueChange={(value) => update.mutate({ subjectId: subject.id, update: { status: value } })}
      >
        <SelectTrigger size="sm" className="w-full sm:w-36">
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

      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          max={100}
          placeholder="Nota"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          onBlur={commitScore}
          className="w-20"
        />
        {subject.letterGrade && (
          <span className={cn("w-4 text-sm font-semibold", LETTER_STYLES[subject.letterGrade])}>
            {subject.letterGrade}
          </span>
        )}
      </div>

      <Input
        placeholder="Docente"
        value={teacher}
        onChange={(e) => setTeacher(e.target.value)}
        onBlur={commitTeacher}
        className="w-full sm:w-40"
      />

      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        onBlur={commitDate}
        className="w-full sm:w-36"
      />
    </div>
  );
}
