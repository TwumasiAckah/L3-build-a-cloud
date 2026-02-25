import { z } from "zod";

// ZOD SCHEMAS FOR VALIDATION

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const createDatabaseSchema = z.object({
  tenantId: z.string().optional(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(253, "Name too long")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  instances: z.number().min(1).max(5),
  storage_size: z.string().min(1, "Storage size is required"), // e.g., "10Gi"
  postgresql_version: z.number().min(12).max(18),
});

export const updateDatabaseSchema = z.object({
  instances: z.number().min(1).max(5).optional(),
  storage_size: z.string().optional(),
});

// TYPE DEFINITIONS

export type DatabaseStatus =
  | "ready"
  | "creating"
  | "failed"
  | "deleting"
  | "unknown";

export type LoginRequest = z.infer<typeof loginSchema>;

export type LoginResponse = {
  token: string;
  user: { id: number; username: string };
};

export type DatabaseInfo = {
  name: string;
  status: DatabaseStatus;
  instances: number;
  ready_instances: number;
  postgresql_version: string;
  storage_size: string;
  created_at?: string; // ISO date string
  region: string;
};

export type DatabaseListResponse = {
  databases: DatabaseInfo[];
  total: number;
  total_storage_gi: number;
  total_storage_bytes: number;
};

export type CreateDatabaseRequest = z.infer<typeof createDatabaseSchema>;

export type UpdateDatabaseRequest = z.infer<typeof updateDatabaseSchema>;

export type DatabaseCredentials = {
  username: string;
  password: string;
  host: string;
  port: number;
  database: string;
  connection_string: string;
};

export type ErrorResponse = {
  error: string;
  detail?: string;
};

export type ServiceLog = {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
  log_type?: string;
  database_name?: string;
  event_type?: string;
  details?: Record<string, unknown>;
};

export type AuditLog = {
  timestamp: string;
  message: string;
  log_type: string;
  action?: string;
  resource_name?: string;
  user?: string;
  level?: string;
  ip?: string;
  success?: boolean | string;
  resource_type?: string;
  details?: Record<string, unknown>;
};
