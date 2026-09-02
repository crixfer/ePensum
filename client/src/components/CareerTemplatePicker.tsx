import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Trash2 } from "lucide-react";
import { useAttachTemplate, useDeleteTemplate, useTemplates } from "@/hooks/usePensum";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";

export function CareerTemplatePicker() {
  const { data: templates, isLoading } = useTemplates();
  const attach = useAttachTemplate();
  const deleteTemplate = useDeleteTemplate();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const filtered = (templates ?? []).filter((t) =>
    t.careerName.toLowerCase().includes(query.toLowerCase()),
  );

  async function handleAttach(templateId: string) {
    setError(null);
    try {
      await attach.mutateAsync(templateId);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo seleccionar este pensum");
    }
  }

  async function handleDelete(templateId: string) {
    setError(null);
    try {
      await deleteTemplate.mutateAsync(templateId);
      setConfirmingId(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar este pensum");
      setConfirmingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Busca tu carrera…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          No hay pensums disponibles todavía para esa carrera.
        </p>
      )}

      <ul className="space-y-2">
        {filtered.map((template) => (
          <li
            key={template.id}
            className="flex items-center justify-between rounded-xl border border-border p-4"
          >
            <div>
              {template.universityName && (
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {template.universityName}
                </p>
              )}
              <p className="text-sm font-medium text-foreground">{template.careerName}</p>
              <p className="text-xs text-muted-foreground">
                {template.subjectCount} asignaturas · {template.totalCredits} créditos
              </p>
            </div>

            {confirmingId === template.id ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(template.id)}
                  disabled={deleteTemplate.isPending}
                >
                  Confirmar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmingId(null)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => handleAttach(template.id)} disabled={attach.isPending}>
                  Usar este pensum
                </Button>
                {template.canDelete && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setConfirmingId(template.id)}
                    title="Eliminar este pensum"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
