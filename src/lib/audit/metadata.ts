import type { Database, Json } from "@/types/database.types";

export type AuditLogMetadata = Database["public"]["Tables"]["audit_logs"]["Insert"]["metadata"];

export function auditMetadata(metadata: { [key: string]: Json | undefined }): AuditLogMetadata {
  return metadata;
}
