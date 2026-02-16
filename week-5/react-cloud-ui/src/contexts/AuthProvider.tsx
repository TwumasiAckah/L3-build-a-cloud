import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type LoginRequest, type LoginResponse } from "../shared/schema";
import {
  type AuthContextType,
  AuthContext,
} from "../hooks/auth-hooks/use-auth";
import { useLocation } from "wouter";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<LoginResponse["user"] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    queryClient.clear();
    setLocation("/login");
  }, [queryClient, setLocation]);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUserRaw = localStorage.getItem(USER_KEY);

        if (storedToken && storedUserRaw) {
          const parsedUser = JSON.parse(storedUserRaw);

          setUser(parsedUser);
          setToken(storedToken);
        }
      } catch (error) {
        console.error("Failed to restore auth state:", error);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          (res.status === 401
            ? "Invalid username or password"
            : "Login failed. Please try again.");
        throw new Error(errorMessage);
      }

      return (await res.json()) as LoginResponse;
    },
    onSuccess: (data) => {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setLocation("/dashboard");
    },
    onError: (error) => {
      console.error("Login failed:", error);
    },
  });

  const login = useCallback(
    async (data: LoginRequest) => {
      await loginMutation.mutateAsync(data);
    },
    [loginMutation],
  );

  const contextValue: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated: !!token && !!user,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
