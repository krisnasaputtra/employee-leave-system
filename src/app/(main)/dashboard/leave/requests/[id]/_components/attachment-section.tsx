"use client";

import { useState, useTransition } from "react";

import { FileText, Image, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { removeAttachmentAction, uploadAttachmentAction } from "../../attachment-actions";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE = 5 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getMimeIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <Image className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

interface Attachment {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

interface AttachmentSectionProps {
  requestId: string;
  attachments: Attachment[];
  canUpload: boolean;
  canRemove: boolean;
}

export function AttachmentSection({ requestId, attachments, canUpload, canRemove }: AttachmentSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [uploadError, setUploadError] = useState("");

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");

    // Client-side validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("Invalid file type. Allowed: PDF, JPEG, PNG.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_SIZE) {
      setUploadError(`File too large (${formatBytes(file.size)}). Maximum: 5 MB.`);
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const result = await uploadAttachmentAction(requestId, formData);
      if (result.success) {
        toast.success("Attachment uploaded successfully.");
      } else {
        setUploadError(result.error ?? "Upload failed.");
      }
      e.target.value = "";
    });
  }

  function handleRemove(attachmentId: string, fileName: string) {
    startTransition(async () => {
      const result = await removeAttachmentAction(attachmentId, requestId);
      if (result.success) {
        toast.success(`Removed "${fileName}".`);
      } else {
        toast.error(result.error ?? "Failed to remove attachment.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="h-4 w-4" />
          Attachments
          {attachments.length > 0 && (
            <span className="text-muted-foreground text-sm font-normal">({attachments.length})</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* File list */}
        {attachments.length > 0 ? (
          <div className="space-y-2">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  {getMimeIcon(att.mime_type)}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">{att.original_name}</p>
                    <p className="text-muted-foreground text-xs">{formatBytes(att.size_bytes)}</p>
                  </div>
                </div>
                {canRemove && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                    disabled={isPending}
                    onClick={() => handleRemove(att.id, att.original_name)}
                    aria-label="Delete attachment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No attachments.</p>
        )}

        {/* Upload input */}
        {canUpload && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleUpload}
                disabled={isPending}
                className="text-sm"
              />
              {isPending && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
            </div>
            <p className="text-muted-foreground text-xs">PDF, JPEG, or PNG. Max 5 MB.</p>
            {uploadError && <p className="text-destructive text-sm">{uploadError}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
