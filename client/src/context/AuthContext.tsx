import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  matricula: string;
  universityId: string;
  isAdmin: boolean;
}

interface SignupInput {
  email: string;
  password: string;
  name: string;
  matricula: string;
  universityId: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: SignupInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<AuthUser>("/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const loggedInUser = await api.post<AuthUser>("/auth/login", { email, password });
    setUser(loggedInUser);
  }

  async function signup(input: SignupInput) {
    const newUser = await api.post<AuthUser>("/auth/signup", input);
    setUser(newUser);
  }

  async function logout() {
    await api.post("/auth/logout");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
