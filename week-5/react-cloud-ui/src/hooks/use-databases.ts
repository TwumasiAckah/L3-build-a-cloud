// use-databases.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  DatabaseInfo,
  CreateDatabaseRequest,
  UpdateDatabaseRequest,
  DatabaseCredentials,
} from "../shared/schema";
import { useAuthHeaders } from "./auth-hooks/use-auth-headers";
import { useToast } from "./use-toast";

// --- LIST DATABASES ---
export function useDatabases() {
  const headers = useAuthHeaders();

  return useQuery<DatabaseInfo[]>({
    queryKey: ["databases", headers.Authorization],
    queryFn: async () => {
      const res = await fetch("/api/databases", { headers });
      if (!res.ok) throw new Error("Failed to fetch databases");
      const data = (await res.json()) as {
        databases: DatabaseInfo[];
        total: number;
      };
      return data.databases;
    },
    enabled: !!headers.Authorization,
  });
}

// --- GET SINGLE DATABASE ---
export function useDatabase(name: string) {
  const headers = useAuthHeaders();

  return useQuery<DatabaseInfo | null>({
    queryKey: ["databases", name, headers.Authorization],
    queryFn: async () => {
      const res = await fetch(`/api/databases/${name}`, { headers });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch database");
      return (await res.json()) as DatabaseInfo;
    },
    enabled: !!headers.Authorization && !!name,
  });
}

// --- GET DATABASE CREDENTIALS ---
export function useDatabaseCredentials(name: string) {
  const headers = useAuthHeaders();

  return useQuery<DatabaseCredentials>({
    queryKey: ["databases", name, "credentials", headers.Authorization],
    queryFn: async () => {
      const res = await fetch(`/api/databases/${name}/credentials`, {
        headers,
      });
      if (!res.ok) throw new Error("Failed to fetch credentials");
      return (await res.json()) as DatabaseCredentials;
    },
    enabled: false, // manually triggered
  });
}

// --- CREATE DATABASE ---
export function useCreateDatabase() {
  const queryClient = useQueryClient();
  const headers = useAuthHeaders();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateDatabaseRequest) => {
      const res = await fetch("/api/databases", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ message: "Failed to create database" }));
        throw new Error(err.message || "Failed to create database");
      }
      return (await res.json()) as DatabaseInfo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["databases"] });
      toast({
        title: "Database created",
        description: "Provisioning started.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });
}

// --- UPDATE DATABASE ---
export function useUpdateDatabase() {
  const queryClient = useQueryClient();
  const headers = useAuthHeaders();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      name,
      ...updates
    }: { name: string } & UpdateDatabaseRequest) => {
      const res = await fetch(`/api/databases/${name}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update database");
      return (await res.json()) as DatabaseInfo;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["databases"] });
      queryClient.invalidateQueries({ queryKey: ["databases", data.name] });
      toast({
        title: "Database updated",
        description: "Configuration changes applied.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });
}

// --- DELETE DATABASE ---
export function useDeleteDatabase() {
  const queryClient = useQueryClient();
  const headers = useAuthHeaders();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/databases/${name}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Failed to delete database");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["databases"] });
      toast({
        title: "Database deleted",
        description: "Resource has been removed.",
      });
    },
  });
}
