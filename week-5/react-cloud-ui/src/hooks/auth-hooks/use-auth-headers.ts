import { useAuth } from "./use-auth";
export const useAuthHeaders = (): Record<string, string> => {
  const { token } = useAuth();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
