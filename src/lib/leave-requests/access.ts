import type { ApplicationRole } from "@/lib/permissions";

interface LeaveRequestAccessContext {
  actorId: string;
  actorRole: ApplicationRole;
  requesterId: string;
  requesterManagerId: string | null;
  hasActiveApprovalDelegation?: boolean;
}

export function canViewLeaveRequest({
  actorId,
  actorRole,
  requesterId,
  requesterManagerId,
  hasActiveApprovalDelegation = false,
}: LeaveRequestAccessContext): boolean {
  if (actorRole === "ADMIN") return true;
  if (requesterId === actorId) return true;
  if (actorRole === "MANAGER" && requesterManagerId === actorId) return true;
  if (hasActiveApprovalDelegation && requesterId !== actorId) return true;
  return false;
}

export const canCommentOnLeaveRequest = canViewLeaveRequest;
export const canDownloadLeaveRequestAttachment = canViewLeaveRequest;
