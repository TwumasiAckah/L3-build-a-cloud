import { useContext, createContext } from "react";
import { type LoginRequest, type LoginResponse } from "../../shared/schema";

export interface AuthContextType {
  user: LoginResponse["user"] | null;
  token: string | null;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
