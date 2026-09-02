import { Link, useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm rounded-2xl border-border shadow-sm">
        <CardHeader className="items-center text-center">
          <GraduationCap className="mb-2 size-8 text-primary" />
          <CardTitle className="text-2xl font-semibold tracking-tight">Bienvenido de vuelta</CardTitle>
          <p className="text-sm text-muted-foreground">Inicia sesión para ver tu progreso</p>
        </CardHeader>
        <CardContent>
          <AuthForm
            mode="login"
            onSubmit={async ({ email, password }) => {
              await login(email, password);
              navigate("/");
            }}
          />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Regístrate
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
