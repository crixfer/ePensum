interface DonutStatProps {
  label: string;
  approvedLabel: string;
  pendingLabel: string;
  approved: number;
  pending: number;
  approvedPct: number;
}

const SIZE = 96;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutStat({ label, approvedLabel, pendingLabel, approved, pending, approvedPct }: DonutStatProps) {
  const fraction = Math.min(Math.max(approvedPct / 100, 0), 1);
  const center = SIZE / 2;

  return (
    <div className="flex items-center gap-4">
      <div className="relative size-24 shrink-0">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle
            cx={center}
            cy={center}
            r={RADIUS}
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth={STROKE}
          />
          {fraction > 0 && (
            <circle
              cx={center}
              cy={center}
              r={RADIUS}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
            />
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-semibold text-foreground">
          {Math.round(approvedPct)}%
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          {approved} {approvedLabel.toLowerCase()} · {pending} {pendingLabel.toLowerCase()}
        </p>
      </div>
    </div>
  );
}
