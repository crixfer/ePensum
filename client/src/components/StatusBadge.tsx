import { STATUS_LABELS_ES, type SubjectStatus } from "@epensum/shared";
import { cn } from "@/lib/utils";

const STYLES: Record<SubjectStatus, string> = {
  COMPLETADO: "bg-status-completado-bg text-status-completado",
  EN_CURSO: "bg-status-en-curso-bg text-status-en-curso",
  INSCRITA: "bg-status-inscrita-bg text-status-inscrita",
  PENDIENTE: "bg-status-pendiente-bg text-status-pendiente",
};

export function StatusBadge({ status, className }: { status: SubjectStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        STYLES[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABELS_ES[status]}
    </span>
  );
}
