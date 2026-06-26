"use client";

import { Download } from "lucide-react";

import { useTranslation } from "@/providers/locale-provider";

import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/utils/export-csv";

interface AnalyticsExportButtonProps {
  topLeaveTakersCsv: string;
  balanceOverviewCsv: string;
  year: number;
}

export function AnalyticsExportButton({ topLeaveTakersCsv, balanceOverviewCsv, year }: AnalyticsExportButtonProps) {
  const { t } = useTranslation();
  const handleExport = () => {
    const combined = `=== Top Leave Takers (${year}) ===\n${topLeaveTakersCsv}\n\n=== Balance Overview (${year}) ===\n${balanceOverviewCsv}`;
    downloadCsv(combined, `leave-analytics-${year}.csv`);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      {t("common.export")} CSV
    </Button>
  );
}
