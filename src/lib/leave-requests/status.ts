import type { Database } from "@/types/database.types";

export type LeaveRequestStatus = Database["public"]["Enums"]["leave_request_status"];

export const LEAVE_REQUEST_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
] as const satisfies readonly LeaveRequestStatus[];

export function isLeaveRequestStatus(value: string): value is LeaveRequestStatus {
  return LEAVE_REQUEST_STATUSES.includes(value as LeaveRequestStatus);
}
