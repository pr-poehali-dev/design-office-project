import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getMe } from "./api";

interface User {
  id: string;
  email: string;
  role: "designer" | "client" | "worker";
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  city?: string;
  specialization?: string;
  bio?: string;
  rating: number;
  projects_count: number;
  personal_id?: string;
  experience_years?: number;
  telegram?: string;
  website?: string;
  work_styles?: string;
  work_objects?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(true);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const data = await getMe();
      setUser(data.user);
    } catch {
      // don't logout on network errors
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const payload = parseJwtPayload(token);
    if (!payload) {
      logout();
      setLoading(false);
      return;
    }

    getMe()
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        setUser({
          id: payload.userId as string,
          email: payload.email as string,
          role: payload.role as "designer" | "client" | "worker",
          first_name: "",
          last_name: "",
          rating: 0,
          projects_count: 0,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthProvider;