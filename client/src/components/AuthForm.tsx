import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { MATRICULA_PATTERN, UNIVERSITY_PROFILES } from "@epensum/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, ApiError } from "@/lib/api";

interface SignupValues {
  email: string;
  password: string;
  name: string;
  matricula: string;
  universityId: string;
}

interface AuthFormProps {
  mode: "login" | "signup";
  onSubmit: (values: { email: string; password: string } | SignupValues) => Promise<void>;
}

export function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [matricula, setMatricula] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoginFailed(false);
    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        await onSubmit({
          email,
          password,
          name: `${nombres} ${apellidos}`.trim(),
          matricula,
          universityId,
        });
      } else {
        await onSubmit({ email, password });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado");
      if (mode === "login" && err instanceof ApiError && err.status === 401) {
        setLoginFailed(true);
        setShowReset(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword() {
    setError(null);
    setResetMessage(null);
    try {
      await api.post("/auth/reset-password", { email, password: resetPassword });
      setResetPassword("");
      setShowReset(false);
      setResetMessage("Si el correo existe, la contraseña fue actualizada. Ya puedes iniciar sesión.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cambiar la contraseña");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "signup" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nombres">Nombres</Label>
              <Input id="nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apellidos">Apellidos</Label>
              <Input id="apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="universidad">Universidad</Label>
            <Select value={universityId} onValueChange={setUniversityId} required>
              <SelectTrigger id="universidad" className="w-full">
                <SelectValue placeholder="Selecciona tu universidad" />
              </SelectTrigger>
              <SelectContent>
                {UNIVERSITY_PROFILES.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="matricula">Matrícula</Label>
            <Input
              id="matricula"
              placeholder="202630001 o ABC123"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
              pattern={MATRICULA_PATTERN.source}
              title="Usa solo letras y números, sin guiones ni espacios"
              required
            />
          </div>
        </>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email" className={mode === "login" ? "sr-only" : undefined}>Correo</Label>
        <div className="relative">
          {mode === "login" && <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />}
          <Input
            id="email"
            type="email"
            aria-label={mode === "login" ? "Correo" : undefined}
            placeholder={mode === "login" ? "Correo" : undefined}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={mode === "login" ? "pl-10 placeholder:text-muted-foreground/80" : undefined}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password" className={mode === "login" ? "sr-only" : undefined}>Contraseña</Label>
        <div className="relative">
          {mode === "login" && <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />}
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            aria-label={mode === "login" ? "Contraseña" : undefined}
            placeholder={mode === "login" ? "Contraseña" : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            className={mode === "login" ? "pl-10 pr-10 placeholder:text-muted-foreground/80" : "pr-10"}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {resetMessage && <p className="text-sm text-status-completado">{resetMessage}</p>}
      {showReset && mode === "login" && (
        <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-3">
          <p className="text-sm font-medium text-foreground">Establece una contraseña nueva</p>
          <Input
            type="password"
            minLength={8}
            placeholder="Mínimo 8 caracteres"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={handleResetPassword} disabled={resetPassword.length < 8 || !email}>
              Cambiar contraseña
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowReset(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
      {!showReset && mode === "login" && loginFailed && (
        <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => setShowReset(true)}>
          Olvidé mi contraseña
        </button>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Un momento…" : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
      </Button>
    </form>
  );
}
