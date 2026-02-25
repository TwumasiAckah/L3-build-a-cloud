import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "../shared/routes";
import { useAuthHeaders } from "./auth-hooks/use-auth-headers";
import type { ServiceLog, AuditLog } from "../shared/schema";

export function useServiceLogs(name: string) {
  const headers = useAuthHeaders();
  const url = buildUrl(api.logs.service.path, { name });

  return useQuery<ServiceLog[]>({
    queryKey: [api.logs.service.path, name],
    queryFn: async () => {
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return api.logs.service.responses[200].parse(await res.json());
    },
    enabled: !!headers.Authorization && !!name,
    refetchInterval: 5000,
  });
}

export function useAuditLogs() {
  const headers = useAuthHeaders();

  return useQuery<AuditLog[]>({
    queryKey: [api.logs.audit.path],
    queryFn: async () => {
      const res = await fetch(api.logs.audit.path, { headers });
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return api.logs.audit.responses[200].parse(await res.json());
    },
    enabled: !!headers.Authorization,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });
}
