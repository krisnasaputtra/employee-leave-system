"use client";

import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation } from "@/providers/locale-provider";

import {
  fetchApprovals,
  type FetchApprovalsResult,
} from "../fetch-approvals";
import { ApprovalsTable } from "./approvals-table";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ApprovalsPageClientProps {
  initialData: FetchApprovalsResult;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ApprovalsPageClient({ initialData }: ApprovalsPageClientProps) {
  const { t } = useTranslation();
  const { data, isFetching } = useQuery({
    queryKey: ["approvals", "pending"],
    queryFn: () => fetchApprovals(),
    initialData,
    placeholderData: (previousData) => previousData, // keep old data while refetching
  });

  const requests = data?.requests ?? [];
  const capacityWarnings = data?.capacityWarnings ?? {};

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="font-semibold text-2xl tracking-tight">
          {t("approval.title")}
        </h1>
        <Badge variant="secondary">{requests.length}</Badge>
        {isFetching && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      {requests.length === 0 && !isFetching ? (
        <EmptyState
          icon={ClipboardCheck}
          title={t("approval.noApprovals")}
          description={t("approval.noApprovalsDescription")}
        />
      ) : (
        <ApprovalsTable
          requests={requests}
          capacityWarnings={capacityWarnings}
        />
      )}
    </div>
  );
}
