import { GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getAcademicTitle } from "@/lib/utils";

export function GraduationCard({ name, careerName }: { name: string; careerName: string }) {
  const title = getAcademicTitle(careerName);

  return (
    <Card className="rounded-2xl border-honor bg-honor-bg shadow-sm">
      <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
        <GraduationCap className="size-10 text-honor" />
        <h2 className="text-xl font-semibold tracking-tight text-honor">
          ¡Felicidades {title ? `${title} ` : ""}
          {name}!
        </h2>
        <p className="text-sm font-medium text-honor">Ya eres profesional.</p>
      </CardContent>
    </Card>
  );
}
