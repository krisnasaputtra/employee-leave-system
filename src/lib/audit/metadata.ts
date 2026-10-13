import type { Database, Json } from "@/types/database.types";

export type AuditLogMetadata = Database["public"]["Tables"]["audit_logs"]["Insert"]["metadata"];

export function auditMetadata(metadata: { [key: string]: Json | undefined }): AuditLogMetadata {
  return metadata;
}

export function getAuditMetadataObject(metadata: unknown): Record<string, unknown> {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return Object.fromEntries(Object.entries(metadata));
  }
  return {};
}

export function getAuditMetadataString(metadata: unknown, key: string): string | null {
  const value = getAuditMetadataObject(metadata)[key];
  return typeof value === "string" ? value : null;
}
