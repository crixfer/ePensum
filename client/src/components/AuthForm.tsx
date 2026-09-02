import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { MATRICULA_PATTERN, UNIVERSITY_PROFILES } from "@epensum/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api";

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

function formatMatricula(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 9);
  return digits.length <= 5 ? digits : `${digits.slice(0, 5)}-${digits.slice(5)}`;
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
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
    } finally {
      setIsSubmitting(false);
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
              placeholder="20263-0001"
              value={matricula}
              onChange={(e) => setMatricula(formatMatricula(e.target.value))}
              pattern={MATRICULA_PATTERN.source}
              title="Formato: 20263-0001"
              required
            />
          </div>
        </>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            className="pr-10"
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
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Un momento…" : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
      </Button>
    </form>
  );
}
