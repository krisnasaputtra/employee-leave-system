"use client";

import { useTransition } from "react";

import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { getAttachmentDownloadUrlAction } from "../../attachment-actions";

interface DownloadButtonProps {
  attachmentId: string;
  fileName: string;
}

export function DownloadButton({ attachmentId, fileName }: DownloadButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleDownload() {
    startTransition(async () => {
      const result = await getAttachmentDownloadUrlAction(attachmentId);
      if (result.success && result.url) {
        // Open signed URL in new tab
        window.open(result.url, "_blank", "noopener,noreferrer");
      } else {
        toast.error(result.error ?? "Failed to generate download link.");
      }
    });
  }

  return (
    <Button variant="ghost" size="sm" disabled={isPending} onClick={handleDownload} title={`Download ${fileName}`}>
      {isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Download className="mr-1 h-3 w-3" />}
      Download
    </Button>
  );
}
