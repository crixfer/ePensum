import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import emblem from "@/assets/epensum-emblem.png";
import { useAuth } from "@/context/AuthContext";

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <Card className="w-full max-w-sm rounded-2xl border-border shadow-sm">
          <CardHeader className="items-center text-center">
            <img src={emblem} alt="" className="mx-auto mb-2 h-20 w-20" />
            <Logo className="mb-2 text-2xl" slogan />
            <CardTitle className="text-2xl font-semibold tracking-tight">Crea tu cuenta</CardTitle>
            <p className="text-sm text-muted-foreground">Empieza a seguir el progreso de tu carrera</p>
          </CardHeader>
          <CardContent>
            <AuthForm
              mode="signup"
              onSubmit={async (values) => {
                if (!("name" in values)) return;
                await signup(values);
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
      <Footer />
    </div>
  );
}
