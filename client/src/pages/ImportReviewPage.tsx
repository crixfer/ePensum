import { Navigate, useLocation, useNavigate } from "react-router-dom";
import type { ParsedPensum } from "@epensum/shared";
import { ImportReviewTable } from "@/components/ImportReviewTable";
import { useImportPensum } from "@/hooks/usePensum";
import { ApiError } from "@/lib/api";
import { useState } from "react";

export function ImportReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const importPensum = useImportPensum();
  const [error, setError] = useState<string | null>(null);

  const parsed = (location.state as { parsed?: ParsedPensum } | null)?.parsed;

  if (!parsed) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Revisa tu pensum</h1>
        <p className="text-sm text-muted-foreground">
          Confirma que todo se leyó correctamente antes de guardarlo.
        </p>
      </div>
      <ImportReviewTable
        parsed={parsed}
        isSubmitting={importPensum.isPending}
        onConfirm={async (payload) => {
          setError(null);
          try {
            await importPensum.mutateAsync(payload);
            navigate("/");
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo importar el pensum");
          }
        }}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
