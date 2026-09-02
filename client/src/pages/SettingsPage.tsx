import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useDetachPensum } from "@/hooks/usePensum";

export function SettingsPage() {
  const { user, logout } = useAuth();
  const detach = useDetachPensum();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  async function handleStartOver() {
    await detach.mutateAsync();
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
        <CardHeader>
          <CardTitle className="text-lg font-medium">Empezar de nuevo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Elimina tu pensum activo y tu progreso para elegir o subir otro.
          </p>
        </CardHeader>
        <CardContent>
          {confirming ? (
            <div className="flex items-center gap-2">
              <Button variant="destructive" onClick={handleStartOver} disabled={detach.isPending}>
                Sí, eliminar mi progreso
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setConfirming(true)}>
              Eliminar pensum activo
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
