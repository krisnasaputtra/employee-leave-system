import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

// We'll import the server action
import { addCommentAction } from "@/app/(main)/dashboard/leave/requests/comment-actions";

export function useAddComment() {
  return useMutation({
    mutationFn: async ({ requestId, content }: { requestId: string; content: string }) => {
      const result = await addCommentAction({ request_id: requestId, comment: content });
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
