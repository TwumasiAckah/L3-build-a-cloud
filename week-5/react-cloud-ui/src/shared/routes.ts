import { z } from "zod";
import {
  loginSchema,
  createDatabaseSchema,
  updateDatabaseSchema,
} from "./schema";

// SHARED ERROR SCHEMAS
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// API ROUTES
export const api = {
  auth: {
    login: {
      method: "POST" as const,
      path: "/login" as const,
      input: loginSchema,
      responses: {
        200: z.object({
          token: z.string(),
          user: z.object({ id: z.number(), username: z.string() }),
        }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  databases: {
    list: {
      method: "GET" as const,
      path: "/api/databases" as const,
      responses: {
        200: z.object({
          databases: z.array(
            z.object({
              name: z.string(),
              status: z.enum([
                "ready",
                "creating",
                "failed",
                "deleting",
                "unknown",
              ]),
              instances: z.number(),
              ready_instances: z.number(),
              postgresql_version: z.string(),
              storage_size: z.number(),
              created_at: z.string().optional(),
            }),
          ),
          total: z.number(),
        }),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/databases" as const,
      input: createDatabaseSchema,
      responses: {
        201: z.object({
          name: z.string(),
          status: z.enum([
            "ready",
            "creating",
            "failed",
            "deleting",
            "unknown",
          ]),
          instances: z.number(),
          ready_instances: z.number(),
          postgresql_version: z.string(),
          storage_size: z.number(),
          created_at: z.string().optional(),
        }),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/databases/:name" as const,
      responses: {
        200: z.object({
          name: z.string(),
          status: z.enum([
            "ready",
            "creating",
            "failed",
            "deleting",
            "unknown",
          ]),
          instances: z.number(),
          ready_instances: z.number(),
          postgresql_version: z.string(),
          storage_size: z.number(),
          created_at: z.string().optional(),
        }),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/databases/:name" as const,
      input: updateDatabaseSchema,
      responses: {
        200: z.object({
          name: z.string(),
          status: z.enum([
            "ready",
            "creating",
            "failed",
            "deleting",
            "unknown",
          ]),
          instances: z.number(),
          ready_instances: z.number(),
          postgresql_version: z.string(),
          storage_size: z.number(),
          created_at: z.string().optional(),
        }),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/databases/:name" as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    credentials: {
      method: "GET" as const,
      path: "/api/databases/:name/credentials" as const,
      responses: {
        200: z.object({
          username: z.string(),
          password: z.string(),
          host: z.string(),
          port: z.number(),
          database: z.string(),
          connection_string: z.string(),
        }),
        404: errorSchemas.notFound,
      },
    },
  },
  logs: {
    service: {
      method: "GET" as const,
      path: "/api/logs/:name" as const,
      responses: {
        200: z.array(
          z.object({
            timestamp: z.string(),
            level: z.enum(["INFO", "WARN", "ERROR"]),
            message: z.string(),
          }),
        ),
      },
    },
    audit: {
      method: "GET" as const,
      path: "/api/audit" as const,
      responses: {
        200: z.array(
          z.object({
            id: z.number(),
            userId: z.number().optional(),
            username: z.string(),
            action: z.string(),
            resource: z.string(),
            details: z.string().optional(),
            timestamp: z.string(),
          }),
        ),
      },
    },
  },
};

// HELPERS
export function buildUrl(
  path: string,
  params?: Record<string, string | number>,
): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
