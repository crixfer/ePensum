import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Repeat, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useArchivePensum, useDetachPensum, usePensum } from "@/hooks/usePensum";

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { data: pensum } = usePensum();
  const archive = useArchivePensum();
  const detach = useDetachPensum();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState<"change" | "delete" | null>(null);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  async function handleConfirm() {
    if (confirming === "change") {
      await archive.mutateAsync();
    } else {
      await detach.mutateAsync();
    }
    setConfirming(null);
    navigate("/onboarding");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ajustes</h1>

      <Card className="rounded-2xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            <p className="font-medium text-foreground">{user?.name}</p>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border shadow-sm">
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-lg font-medium">Tu pensum</CardTitle>
            <p className="text-sm text-muted-foreground">
              {pensum?.summary.careerName ?? "Sin pensum activo"}
              {pensum?.summary.universityName ? ` · ${pensum.summary.universityName}` : ""}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => setConfirming("delete")}
            title="Eliminar pensum activo"
          >
            <Trash2 className="size-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {confirming ? (
            <div className="space-y-2">
              <p className="text-sm text-status-en-curso">
                {confirming === "change"
                  ? "Tu pensum actual quedará guardado con tu progreso tal cual está, y podrás elegir o subir otro. ¿Continuar?"
                  : "Esto elimina tu pensum activo y todo tu progreso de forma permanente. ¿Continuar?"}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-status-en-curso text-white hover:bg-status-en-curso/90"
                  onClick={handleConfirm}
                  disabled={archive.isPending || detach.isPending}
                >
                  Sí, continuar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                ¿Estudias en más de una universidad o cambiaste de carrera? Al cambiar de pensum, el actual se
                guarda con tu progreso tal cual está para que no pierdas esa información. Si en cambio quieres
                borrar tu pensum activo y todo tu progreso, usa el ícono de basurero.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setConfirming("change")}>
                  <Repeat className="size-4" />
                  Cambiar pensum
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

