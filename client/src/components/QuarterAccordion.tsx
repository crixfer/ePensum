import type { QuarterView } from "@epensum/shared";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { StatusBadge } from "@/components/StatusBadge";
import { SubjectRow } from "@/components/SubjectRow";

export function QuarterAccordion({ quarters }: { quarters: QuarterView[] }) {
  return (
    <Accordion type="multiple" defaultValue={quarters.map((q) => q.id)} className="space-y-3">
      {quarters.map((quarter) => {
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
              {quarter.subjects.map((subject) => (
                <SubjectRow key={subject.id} subject={subject} />
              ))}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
