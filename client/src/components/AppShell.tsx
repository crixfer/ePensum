import { Link, useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import emblem from "@/assets/epensum-emblem.png";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const initials = user?.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={emblem} alt="" className="h-8 w-8" />
            <Logo />
          </Link>
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.matricula}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-muted-foreground text-xs">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <Settings className="size-4" />
                      Ajustes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>Cerrar sesión</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <Footer />
    </div>
  );
}
