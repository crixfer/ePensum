import { Link, useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/context/AuthContext";

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm rounded-2xl border-border shadow-sm">
        <CardHeader className="items-center text-center">
          <GraduationCap className="mb-2 size-8 text-primary" />
          <CardTitle className="text-2xl font-semibold tracking-tight">Crea tu cuenta</CardTitle>
          <p className="text-sm text-muted-foreground">Empieza a seguir el progreso de tu carrera</p>
        </CardHeader>
        <CardContent>
          <AuthForm
            mode="signup"
            onSubmit={async ({ email, password, name }) => {
              await signup(email, password, name ?? "");
              navigate("/onboarding");
            }}
          />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
