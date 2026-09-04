import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Repeat, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { useArchivePensum, useDetachPensum, usePensum, useUpdateUniversityName } from "@/hooks/usePensum";

export function SettingsPage() {
  const { user, logout, updateAccount, changePassword } = useAuth();
  const { data: pensum } = usePensum();
  const archive = useArchivePensum();
  const detach = useDetachPensum();
  const updateUniversityName = useUpdateUniversityName();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState<"change" | "delete" | null>(null);
  const [editingUniversity, setEditingUniversity] = useState(false);
  const [universityDraft, setUniversityDraft] = useState("");
  const [universityError, setUniversityError] = useState<string | null>(null);
  const [names, setNames] = useState(() => user?.name.split(" ")[0] ?? "");
  const [lastNames, setLastNames] = useState(() => user?.name.split(" ").slice(1).join(" ") ?? "");
  const [email, setEmail] = useState(() => user?.email ?? "");
  const [matricula, setMatricula] = useState(() => user?.matricula.replace(/[^a-zA-Z0-9]/g, "") ?? "");
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

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

  function startEditingUniversity() {
    setUniversityDraft(pensum?.summary.universityName ?? "");
    setUniversityError(null);
    setEditingUniversity(true);
  }

  async function handleSaveUniversity() {
    setUniversityError(null);
    try {
      await updateUniversityName.mutateAsync(universityDraft.trim() || null);
      setEditingUniversity(false);
    } catch (err) {
      setUniversityError(err instanceof ApiError ? err.message : "No se pudo actualizar la universidad");
    }
  }

  async function handleSaveAccount() {
    setAccountError(null);
    setAccountMessage(null);
    try {
      await updateAccount({
        email: email.trim(),
        name: `${names.trim()} ${lastNames.trim()}`.trim(),
        matricula: matricula.trim(),
      });
      setAccountMessage("Datos actualizados");
    } catch (err) {
      setAccountError(err instanceof ApiError ? err.message : "No se pudieron actualizar los datos");
    }
  }

  async function handleChangePassword() {
    setPasswordError(null);
    setPasswordMessage(null);
    try {
      await changePassword(newPassword);
      setNewPassword("");
      setPasswordMessage("Contraseña actualizada");
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "No se pudo actualizar la contraseña");
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          <span className="text-primary">A</span>justes
        </h1>
        {pensum && (
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="size-4" />
            Volver a mi pensum
          </Button>
        )}
      </div>

      <Card className="rounded-2xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="account-names" className="text-sm font-medium">Nombres</label>
                <Input id="account-names" value={names} onChange={(e) => setNames(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="account-last-names" className="text-sm font-medium">Apellidos</label>
                <Input id="account-last-names" value={lastNames} onChange={(e) => setLastNames(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="account-matricula" className="text-sm font-medium">Matrícula</label>
              <Input
                id="account-matricula"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
                pattern="[a-zA-Z0-9]+"
                title="Usa solo letras y números, sin guiones ni espacios"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="account-email" className="text-sm font-medium">Correo</label>
              <Input id="account-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button onClick={handleSaveAccount}>Guardar datos</Button>
            {accountMessage && <p className="text-sm text-status-completado">{accountMessage}</p>}
            {accountError && <p className="text-sm text-destructive">{accountError}</p>}
          </div>
          <div className="space-y-3 border-t border-border pt-4">
            <div className="space-y-1.5">
              <label htmlFor="new-password" className="text-sm font-medium">Nueva contraseña</label>
              <Input
                id="new-password"
                type="password"
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={handleChangePassword} disabled={newPassword.length < 8}>
              Cambiar contraseña
            </Button>
            {passwordMessage && <p className="text-sm text-status-completado">{passwordMessage}</p>}
            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
          </div>
          <Button variant="outline" onClick={handleLogout}>Cerrar sesión</Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border shadow-sm">
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg font-medium">Tu pensum</CardTitle>
            <p className="text-sm text-muted-foreground">{pensum?.summary.careerName ?? "Sin pensum activo"}</p>
            {editingUniversity ? (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Input
                    value={universityDraft}
                    onChange={(e) => setUniversityDraft(e.target.value)}
                    placeholder="Nombre de la universidad"
                    className="h-8"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleSaveUniversity} disabled={updateUniversityName.isPending}>
                    Guardar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingUniversity(false)}>
                    Cancelar
                  </Button>
                </div>
                {universityError && <p className="text-sm text-destructive">{universityError}</p>}
              </div>
            ) : (
              pensum && (
                <button
                  type="button"
                  onClick={startEditingUniversity}
                  className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  {pensum.summary.universityName ?? "Agregar nombre de universidad"}
                  <Pencil className="size-3.5" />
                </button>
              )
            )}
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

