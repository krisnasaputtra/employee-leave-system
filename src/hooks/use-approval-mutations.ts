import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { approveLeaveRequestAction, rejectLeaveRequestAction, bulkApproveAction, bulkRejectAction } from "@/app/(main)/dashboard/approvals/actions";

export const APPROVAL_KEYS = {
  all: ["approvals"] as const,
  pending: ["approvals", "pending"] as const,
};

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const result = await approveLeaveRequestAction(requestId);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (result) => {
      toast.success(`Request ${result.request_number ?? ""} approved.`);
      queryClient.invalidateQueries({ queryKey: APPROVAL_KEYS.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRejectLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const result = await rejectLeaveRequestAction(requestId, { rejection_reason: reason });
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (result) => {
      toast.success(`Request ${result.request_number ?? ""} rejected.`);
      queryClient.invalidateQueries({ queryKey: APPROVAL_KEYS.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useBulkApprove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestIds: string[]) => {
      const result = await bulkApproveAction(requestIds);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPROVAL_KEYS.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useBulkReject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestIds, reason }: { requestIds: string[]; reason: string }) => {
      const result = await bulkRejectAction(requestIds, reason);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPROVAL_KEYS.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
