import { useEffect, useRef, useState } from "react";
import type { ExtraFieldType, QuarterView, SubjectStatus } from "@epensum/shared";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { StatusBadge } from "@/components/StatusBadge";
import { SubjectRow } from "@/components/SubjectRow";
import { toTitleCase } from "@/lib/utils";

const OPEN_QUARTERS_STORAGE_KEY = "epensum:openQuarters";

function loadStoredOpenQuarters(): string[] | null {
  try {
    const raw = localStorage.getItem(OPEN_QUARTERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const YEAR_ORDINALS = ["Primer", "Segundo", "Tercer", "Cuarto", "Quinto", "Sexto", "Séptimo", "Octavo", "Noveno", "Décimo"];
const QUARTERS_PER_YEAR = 3;

function yearLabel(yearIndex: number): string {
  const ordinal = YEAR_ORDINALS[yearIndex];
  return ordinal ? `${ordinal} Año` : `Año ${yearIndex + 1}`;
}

/** Every three consecutive quarters (in order) make up one academic year. */
function groupQuartersByYear(quarters: QuarterView[]): QuarterView[][] {
  const groups: QuarterView[][] = [];
  for (let i = 0; i < quarters.length; i += QUARTERS_PER_YEAR) {
    groups.push(quarters.slice(i, i + QUARTERS_PER_YEAR));
  }
  return groups;
}

/** Column labels aligned to SubjectRow's grid — same template, order, and widths. */
function SubjectRowHeader({ extraField }: { extraField: ExtraFieldType }) {
  return (
    <div className="hidden border-b border-border pb-2 text-xs font-medium tracking-wide text-primary sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto_auto] sm:items-center sm:gap-4">
      <div className="sm:order-1 flex items-center sm:gap-1">
        <span className={extraField === "orden" ? "sm:w-6" : "sm:w-36"}>
          {extraField === "orden" ? "N°" : "Fecha"}
        </span>
        <span className="sm:w-6 sm:text-center">CR</span>
        <span className="sm:w-6 sm:text-center">HT</span>
      </div>
      <span className="sm:order-2">Asignatura</span>
      <span className="sm:order-3 sm:w-40 sm:text-center">Clave · Pre</span>
      <span className="sm:order-4 sm:w-36">Estatus</span>
      <span className="sm:order-5 sm:w-20">Nota</span>
      <span className="sm:order-6 sm:w-40">Docente</span>
    </div>
  );
}

export function QuarterAccordion({
  quarters,
  extraField,
}: {
  quarters: QuarterView[];
  extraField: ExtraFieldType;
}) {
  const [openQuarters, setOpenQuarters] = useState<string[]>(() => {
    const stored = loadStoredOpenQuarters();
    if (stored) return stored;
    return quarters[0] ? [quarters[0].id] : [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_QUARTERS_STORAGE_KEY, JSON.stringify(openQuarters));
    } catch {
      // ignore storage errors (private browsing, quota, etc.)
    }
  }, [openQuarters]);

  // When a quarter transitions to Completado, close it and open the next one.
  // Keyed off a ref (not state) so this only reacts to a fresh transition —
  // never on mount, e.g. for a quarter that was already completed earlier.
  const previousStatusesRef = useRef<Record<string, SubjectStatus> | null>(null);

  useEffect(() => {
    const previousStatuses = previousStatusesRef.current;
    if (previousStatuses) {
      quarters.forEach((quarter, index) => {
        const wasCompleted = previousStatuses[quarter.id] === "COMPLETADO";
        if (!wasCompleted && quarter.status === "COMPLETADO") {
          const nextQuarter = quarters[index + 1];
          setOpenQuarters((current) => {
            const next = current.filter((id) => id !== quarter.id);
            if (nextQuarter && !next.includes(nextQuarter.id)) next.push(nextQuarter.id);
            return next;
          });
        }
      });
    }
    previousStatusesRef.current = Object.fromEntries(quarters.map((q) => [q.id, q.status]));
  }, [quarters]);

  const yearGroups = groupQuartersByYear(quarters);

  return (
    <Accordion type="multiple" value={openQuarters} onValueChange={setOpenQuarters} className="space-y-8">
      {yearGroups.map((yearQuarters, yearIndex) => (
        <div key={yearIndex} className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-primary">{yearLabel(yearIndex)}</h2>
          <div className="space-y-3">
            {yearQuarters.map((quarter) => {
              const completed = quarter.subjects.filter((s) => s.status === "COMPLETADO").length;
              return (
                <AccordionItem
                  key={quarter.id}
                  value={quarter.id}
                  className="rounded-2xl border border-border bg-card px-5 shadow-sm"
                >
                  <AccordionTrigger className="py-4 hover:no-underline">
                    <div className="flex flex-1 flex-wrap items-center justify-between gap-2 pr-2">
                      <span className="text-sm font-medium text-foreground">{quarter.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {completed}/{quarter.subjects.length} completadas
                        </span>
                        <StatusBadge status={quarter.status} />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <SubjectRowHeader extraField={extraField} />
                    {quarter.subjects.map((subject) => (
                      <SubjectRow
                        key={subject.id}
                        subject={{ ...subject, name: toTitleCase(subject.name) }}
                        extraField={extraField}
                      />
                    ))}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </div>
        </div>
      ))}
    </Accordion>
  );
}
