"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/utils/export-csv";

interface ExportButtonProps {
  csvContent: string;
  filename: string;
}

export function ExportButton({ csvContent, filename }: ExportButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => downloadCsv(csvContent, filename)}
    >
      <Download className="mr-2 h-4 w-4" />
      Export CSV
    </Button>
  );
}
