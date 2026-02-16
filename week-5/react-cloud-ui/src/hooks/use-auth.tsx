import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type LoginRequest, type LoginResponse } from "../shared/schema";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export interface AuthContextType {
  user: LoginResponse["user"] | null;
  token: string | null;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<LoginResponse["user"] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserRaw = localStorage.getItem("user");

    if (storedToken && storedUserRaw) {
      try {
        const parsedUser = JSON.parse(storedUserRaw);
        setUser(parsedUser);
        setToken(storedToken);
      } catch (e) {
        console.warn("Invalid user in localStorage, clearing...", e);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }

    setIsLoading(false);
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid username or password");
        throw new Error("Login failed");
      }

      return (await res.json()) as LoginResponse;
    },
    onSuccess: (data) => {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    },
  });

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    queryClient.clear();
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login: async (data: LoginRequest) => {
          try {
            await loginMutation.mutateAsync(data);
          } catch (err) {
            console.error("Login error:", err);
            throw err;
          }
        },
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// Stable fetch helper
export const useAuthHeaders = (): Record<string, string> => {
  const { token } = useAuth();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
