"use client";

import { useRef, useTransition } from "react";

import {
  CheckCircle,
  Clock,
  Loader2,
  MessageSquare,
  Send,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { addCommentAction } from "../../comment-actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditEvent {
  id: string;
  action: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
  actor_employee_id: string | null;
}

interface CommentSectionProps {
  requestId: string;
  events: AuditEvent[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getEventIcon(action: string) {
  if (action === "COMMENT_ADDED") {
    return <MessageSquare className="h-4 w-4 text-blue-500" />;
  }
  if (action.includes("APPROVED") || action.includes("APPROVE")) {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  }
  if (action.includes("REJECTED") || action.includes("REJECT")) {
    return <XCircle className="h-4 w-4 text-red-500" />;
  }
  return <Clock className="h-4 w-4 text-muted-foreground" />;
}

function getEventLabel(action: string): string {
  switch (action) {
    case "COMMENT_ADDED":
      return "commented";
    case "LEAVE_REQUEST_CREATED":
      return "created this request";
    case "LEAVE_REQUEST_UPDATED":
      return "updated this request";
    case "LEAVE_REQUEST_APPROVED":
      return "approved this request";
    case "LEAVE_REQUEST_REJECTED":
      return "rejected this request";
    case "LEAVE_REQUEST_CANCELLED":
      return "cancelled this request";
    default:
      return action.toLowerCase().replace(/_/g, " ");
  }
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommentSection({ requestId, events }: CommentSectionProps) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const comment = formData.get("comment") as string;

    if (!comment?.trim()) {
      toast.error("Comment cannot be empty.");
      return;
    }

    startTransition(async () => {
      const result = await addCommentAction({
        request_id: requestId,
        comment: comment.trim(),
      });

      if (result.success) {
        toast.success("Comment added.");
        formRef.current?.reset();
      } else {
        toast.error(result.error ?? "Failed to add comment.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comments &amp; Activity</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Timeline */}
        {events.length > 0 ? (
          <div className="relative space-y-0 pl-6">
            {events.map((event, index) => {
              const actorName =
                (event.metadata?.actor_name as string) ?? "System";
              const isComment = event.action === "COMMENT_ADDED";
              const commentText = isComment
                ? (event.metadata?.comment as string)
                : null;
              const isLast = index === events.length - 1;

              return (
                <div key={event.id} className="relative pb-6 last:pb-0">
                  {/* Connector line to next item (not on last) */}
                  {!isLast && (
                    <span className="absolute -left-[calc(1.5rem-4px)] top-5 bottom-0 w-0.5 bg-border" />
                  )}

                  {/* Dot on the timeline */}
                  <span className="absolute -left-[calc(1.5rem+5px)] flex h-5 w-5 items-center justify-center rounded-full bg-background ring-2 ring-border">
                    {getEventIcon(event.action)}
                  </span>

                  {/* Content */}
                  <div className="space-y-1">
                    <p className="text-sm leading-snug">
                      <span className="font-medium">{actorName}</span>{" "}
                      <span className="text-muted-foreground">
                        {getEventLabel(event.action)}
                      </span>
                    </p>

                    {commentText && (
                      <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">
                        {commentText}
                      </div>
                    )}

                    {event.action === "LEAVE_REQUEST_REJECTED" &&
                      Boolean(event.metadata?.rejection_reason) && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                          {String(event.metadata?.rejection_reason)}
                        </div>
                      )}

                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(event.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        )}

        <Separator />

        {/* Comment Form */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-3"
        >
          <Textarea
            name="comment"
            placeholder="Add a comment…"
            maxLength={500}
            rows={3}
            disabled={isPending}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1 h-4 w-4" />
              )}
              Comment
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
