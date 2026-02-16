import { useEffect } from "react";
import { useAuth } from "./use-auth";
import { useLocation } from "wouter";
export const useRequireAuth = (redirectTo = "/login") => {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, setLocation]);

  return { isAuthenticated, isLoading };
};
