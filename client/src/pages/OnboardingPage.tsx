import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CareerTemplatePicker } from "@/components/CareerTemplatePicker";
import { UploadDropzone } from "@/components/UploadDropzone";
import { usePensum } from "@/hooks/usePensum";
import { ApiError } from "@/lib/api";

export function OnboardingPage() {
  const { data, isLoading, error } = usePensum();

  if (!isLoading && data) {
    return <Navigate to="/" replace />;
  }

  if (isLoading || (error && !(error instanceof ApiError && error.status === 404))) {
    return <div className="text-center text-muted-foreground">Cargando…</div>;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Empecemos</h1>
        <p className="text-sm text-muted-foreground">Elige tu carrera o sube tu propio pensum</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Selecciona tu carrera</CardTitle>
            <p className="text-sm text-muted-foreground">Usa un pensum que ya subió otro estudiante</p>
          </CardHeader>
          <CardContent>
            <CareerTemplatePicker />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Sube tu pensum</CardTitle>
            <p className="text-sm text-muted-foreground">Importa tu Excel y empieza desde tu progreso actual</p>
          </CardHeader>
          <CardContent>
            <UploadDropzone />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
